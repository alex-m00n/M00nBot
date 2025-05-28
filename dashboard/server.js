import express from 'express';
import session from 'express-session';
import passport from 'passport';
import DiscordStrategy from 'passport-discord';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Client, GatewayIntentBits } from 'discord.js';
import { Server } from 'socket.io';
import fs from 'fs/promises';
import expressLayouts from 'express-ejs-layouts';

// Configuration des variables d'environnement
dotenv.config();

// Configuration pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences
    ]
});

// Initialisation de la collection de commandes
client.commands = new Map();

// Configuration des catégories de commandes
const commandCategories = {
    MODERATION: { name: 'Modération', icon: 'fa-shield-alt', color: 'red' },
    FUN: { name: 'Fun', icon: 'fa-laugh', color: 'yellow' },
    UTILITY: { name: 'Utilitaires', icon: 'fa-tools', color: 'blue' },
    MUSIC: { name: 'Musique', icon: 'fa-music', color: 'green' },
    ADMIN: { name: 'Administration', icon: 'fa-crown', color: 'purple' },
    OTHER: { name: 'Autres', icon: 'fa-ellipsis-h', color: 'gray' }
};

// Configuration des IDs autorisés
const AUTHORIZED_IDS = [process.env.OWNER_ID];

// Configuration du serveur Express
const app = express();
const server = http.createServer({
    maxHeaderSize: 32768,
    maxHttpHeaderSize: 32768
}, app);
const io = new Server(server);

// Configuration des middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'votre_secret_session',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/m00nbot',
        ttl: 24 * 60 * 60
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: false,
        httpOnly: true
    }
}));

// Configuration de Passport
passport.serializeUser((user, done) => {
    done(null, {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar
    });
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URI || 'http://localhost:3000/auth/discord/callback',
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const guilds = await response.json();

        const user = {
            id: profile.id,
            username: profile.username,
            discriminator: profile.discriminator,
            avatar: profile.avatar,
            guilds: guilds
        };

        console.log('Utilisateur créé avec', guilds.length, 'serveurs');
        return done(null, user);
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        return done(error);
    }
}));

// Configuration des middlewares Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuration des vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middleware pour les variables locales
app.use((req, res, next) => {
    res.locals.path = req.path;
    res.locals.title = 'Dashboard';
    res.locals.client = client.isReady() ? client : null;
    res.locals.user = req.user || null;
    next();
});

// Middleware de vérification des permissions
const checkPermissions = async (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }

    try {
        if (AUTHORIZED_IDS.includes(req.user.id)) {
            return next();
        }

        req.logout(() => {
            res.redirect('/login?error=unauthorized');
        });
    } catch (error) {
        console.error('Erreur lors de la vérification des permissions:', error);
        req.logout(() => {
            res.redirect('/login?error=server');
        });
    }
};

// Fonction pour charger les commandes
async function loadCommands() {
    try {
        client.commands.clear();

        const guild = client.guilds.cache.first();
        if (!guild) {
            console.error('Aucun serveur trouvé');
            return;
        }

        const commands = await guild.commands.fetch();
        if (commands) {
            commands.forEach(cmd => {
                categorizeAndAddCommand(cmd);
            });
        }

        const serializableCommands = Array.from(client.commands.values()).map(cmd => ({
            id: cmd.id,
            name: cmd.displayName || `/${cmd.name}`,
            description: cmd.description,
            options: cmd.options,
            defaultMemberPermissions: cmd.defaultMemberPermissions ? cmd.defaultMemberPermissions.toString() : null,
            dmPermission: cmd.dmPermission,
            version: cmd.version,
            category: cmd.category || 'OTHER',
            type: cmd.type || 1
        }));

        io.emit('commandsUpdate', serializableCommands);
        console.log(`${client.commands.size} commandes chargées`);
    } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
    }
}

// Fonction pour catégoriser les commandes
function categorizeAndAddCommand(cmd) {
    let category = 'OTHER';
    const name = cmd.name.toLowerCase();
    const isContextMenu = cmd.type === 2;

    if (name.includes('warn') || name.includes('clear') || name.includes('ban') || name.includes('kick') ||
        name.includes('add-role') || name.includes('remove-role')) {
        category = 'MODERATION';
    }
    else if (name.includes('play') || name.includes('music') || name.includes('song')) {
        category = 'MUSIC';
    }
    else if (name.includes('protect') || name.includes('setup') || name.includes('set') || name.includes('config')) {
        category = 'ADMIN';
    }
    else if (name.includes('help') || name.includes('ping') || name.includes('doc') ||
        name.includes('move') || name.includes('suggest') || name.includes('bug-report') ||
        name.includes('rules') || name.includes('info') || name.includes('userinfo')) {
        category = 'UTILITY';
    }
    else if (name.includes('fun') || name.includes('joke') || name.includes('meme') ||
        name.includes('gif') || name.includes('8ball') || name.includes('roll') || name.includes('tic-tac-toe')) {
        category = 'FUN';
    }

    client.commands.set(cmd.name, {
        ...cmd,
        category,
        displayName: isContextMenu ? cmd.name : `/${cmd.name}`
    });
}

// Fonction pour obtenir les statistiques
async function getStats() {
    if (!client.isReady()) return null;

    const guild = client.guilds.cache.first();
    if (!guild) return null;

    const activity = client.user.presence.activities[0];
    console.log('Activité actuelle:', activity);

    return {
        guilds: 1,
        users: guild.memberCount,
        commands: client.commands.size,
        uptime: client.uptime,
        ping: client.ws.ping,
        activity: activity ? {
            type: activity.type,
            name: activity.name,
            state: activity.state,
            details: activity.details,
            url: activity.url
        } : {
            type: 'WATCHING',
            name: 'M00nBot Dashboard',
            state: '',
            details: '',
            url: ''
        }
    };
}

// Configuration des routes
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Accueil',
        user: req.user
    });
});

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard');
    }
    const error = req.query.error;
    let errorMessage = '';

    switch (error) {
        case 'unauthorized':
            errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder au dashboard.';
            break;
        case 'server':
            errorMessage = 'Une erreur est survenue lors de la vérification des permissions.';
            break;
    }

    res.render('login', {
        title: 'Connexion',
        error: errorMessage
    });
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
    passport.authenticate('discord', {
        failureRedirect: '/login'
    }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

app.get('/dashboard', checkPermissions, (req, res) => {
    const guild = client.guilds.cache.first();
    res.render('dashboard', {
        title: 'Tableau de bord',
        user: req.user,
        guild: guild
    });
});

app.get('/dashboard/commands', checkPermissions, (req, res) => {
    res.render('commands', {
        title: 'Commandes',
        user: req.user,
        commands: client.commands,
        commandCategories: commandCategories
    });
});

app.get('/dashboard/logs', checkPermissions, (req, res) => {
    const guild = client.guilds.cache.first();
    if (!guild) {
        return res.status(404).render('error', { message: 'Aucun serveur trouvé' });
    }

    const channels = guild.channels.cache
        .filter(channel => channel.type === 0)
        .map(channel => ({
            id: channel.id,
            name: channel.name
        }));

    res.render('logs', {
        title: 'Logs',
        user: req.user,
        guilds: channels
    });
});

// Configuration des routes API
app.get('/api/stats', checkPermissions, async (req, res) => {
    try {
        const stats = await getStats();
        if (!stats) {
            return res.status(503).json({
                error: 'Le bot n\'est pas encore prêt',
                details: 'Veuillez réessayer dans quelques secondes'
            });
        }
        res.json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des statistiques',
            details: error.message
        });
    }
});

app.get('/api/guild/:id', checkPermissions, async (req, res) => {
    try {
        const guild = client.guilds.cache.get(req.params.id);
        if (!guild) {
            return res.status(404).json({ error: 'Serveur non trouvé' });
        }

        res.json({
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL(),
            memberCount: guild.memberCount,
            channels: guild.channels.cache.size,
            roles: guild.roles.cache.size,
            createdAt: guild.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des données du serveur' });
    }
});

app.get('/api/guild/:id/commands', checkPermissions, async (req, res) => {
    try {
        const guild = client.guilds.cache.get(req.params.id);
        if (!guild) {
            return res.status(404).json({ error: 'Serveur non trouvé' });
        }

        const commands = await guild.commands.fetch();
        res.json(commands);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
    }
});

app.post('/api/guild/:id/command', checkPermissions, async (req, res) => {
    try {
        const { name, description, options } = req.body;
        const guild = client.guilds.cache.get(req.params.id);

        if (!guild) {
            return res.status(404).json({ error: 'Serveur non trouvé' });
        }

        const command = await guild.commands.create({
            name,
            description,
            options
        });

        res.json(command);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création de la commande' });
    }
});

// Configuration des logs d'activité
const activityLogs = [];
const MAX_LOGS = 50;

function addActivityLog(type, description, data = {}) {
    const log = {
        type,
        description,
        data,
        timestamp: new Date()
    };

    activityLogs.unshift(log);
    if (activityLogs.length > MAX_LOGS) {
        activityLogs.pop();
    }

    io.emit('activityUpdate', { activities: activityLogs.slice(0, 10) });
}

// Configuration des événements Discord
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    addActivityLog('message', `Nouveau message de ${message.author.tag}`, {
        channelId: message.channel.id,
        guildId: message.guild?.id
    });
});

client.on('guildCreate', (guild) => {
    addActivityLog('guild', `Bot ajouté au serveur ${guild.name}`, {
        guildId: guild.id,
        memberCount: guild.memberCount
    });
});

client.on('guildDelete', (guild) => {
    addActivityLog('guild', `Bot retiré du serveur ${guild.name}`, {
        guildId: guild.id
    });
});

client.on('interactionCreate', (interaction) => {
    if (!interaction.isCommand()) return;
    addActivityLog('command', `Commande /${interaction.commandName} utilisée par ${interaction.user.tag}`, {
        guildId: interaction.guildId,
        channelId: interaction.channelId
    });
});

// Configuration des routes de paramètres
app.post('/api/settings/prefix', checkPermissions, async (req, res) => {
    try {
        const { prefix } = req.body;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour du préfixe' });
    }
});

app.post('/api/settings/modlog', checkPermissions, async (req, res) => {
    try {
        const { channelId } = req.body;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour du salon de logs' });
    }
});

app.post('/api/settings/modrole', checkPermissions, async (req, res) => {
    try {
        const { roleId } = req.body;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour du rôle de modérateur' });
    }
});

app.post('/api/settings/welcome', checkPermissions, async (req, res) => {
    try {
        const { message, channelId } = req.body;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres de bienvenue' });
    }
});

// Configuration de la route des logs d'activité
app.get('/api/activity', checkPermissions, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type || 'all';
        const channel = req.query.guild || 'all';
        const time = req.query.time || '24h';

        const now = new Date();
        let timeLimit;
        switch (time) {
            case '1h':
                timeLimit = new Date(now - 60 * 60 * 1000);
                break;
            case '24h':
                timeLimit = new Date(now - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                timeLimit = new Date(now - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                timeLimit = new Date(now - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                timeLimit = new Date(now - 24 * 60 * 60 * 1000);
        }

        let filteredLogs = activityLogs.filter(log => {
            const matchesType = type === 'all' || log.type === type;
            const matchesChannel = channel === 'all' || log.data.channelId === channel;
            const matchesTime = log.timestamp >= timeLimit;
            return matchesType && matchesChannel && matchesTime;
        });

        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedLogs = filteredLogs.slice(start, end);
        const total = filteredLogs.length;

        res.json({
            activities: paginatedLogs,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                hasMore: end < total
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des logs:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des logs',
            details: error.message
        });
    }
});

// Configuration de la route de déconnexion
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/login');
    });
});

// Configuration du gestionnaire d'erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    if (err.code === '431') {
        console.error('Erreur 431 - En-têtes trop longs');
        res.status(431).send('Erreur de connexion. Veuillez réessayer.');
    } else {
        res.status(500).send('Une erreur est survenue !');
    }
});

// Configuration de l'événement ready
client.once('ready', async () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    console.log(`Présent sur ${client.guilds.cache.size} serveurs`);
    console.log('Liste des serveurs:', client.guilds.cache.map(g => `${g.name} (${g.id})`));

    // Attendre que le bot soit complètement prêt
    await new Promise(resolve => setTimeout(resolve, 2000));
    await loadCommands();
});

// Configuration des événements de commandes
client.on('applicationCommandCreate', async (command) => {
    console.log('Nouvelle commande créée:', command.name);
    categorizeAndAddCommand(command);
    io.emit('commandsUpdate', Array.from(client.commands.values()));
    io.emit('statsUpdate', await getStats());
});

client.on('applicationCommandUpdate', async (oldCommand, newCommand) => {
    console.log('Commande mise à jour:', newCommand.name);
    categorizeAndAddCommand(newCommand);
    io.emit('commandsUpdate', Array.from(client.commands.values()));
    io.emit('statsUpdate', await getStats());
});

client.on('applicationCommandDelete', async (command) => {
    console.log('Commande supprimée:', command.name);
    client.commands.delete(command.name);
    io.emit('commandsUpdate', Array.from(client.commands.values()));
    io.emit('statsUpdate', await getStats());
});

// Configuration des routes de commandes
app.get('/api/commands', checkPermissions, async (req, res) => {
    try {
        await loadCommands();

        const commands = Array.from(client.commands.values()).map(cmd => ({
            id: cmd.id,
            name: cmd.displayName || `/${cmd.name}`,
            description: cmd.description,
            options: cmd.options,
            defaultMemberPermissions: cmd.defaultMemberPermissions ? cmd.defaultMemberPermissions.toString() : null,
            dmPermission: cmd.dmPermission,
            version: cmd.version,
            category: cmd.category || 'OTHER',
            type: cmd.type || 1
        }));

        res.json({
            commands,
            categories: commandCategories
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des commandes',
            details: error.message
        });
    }
});

// Fonction pour créer un fichier de commande
async function createCommandFile(name, code) {
    try {
        const commandsDir = path.join(process.cwd(), 'commands');
        const fileName = `${name}.js`;
        const filePath = path.join(commandsDir, fileName);

        try {
            await fs.access(commandsDir);
        } catch {
            await fs.mkdir(commandsDir);
        }

        await fs.writeFile(filePath, code);
        console.log(`Fichier de commande créé: ${fileName}`);
        return true;
    } catch (error) {
        console.error('Erreur lors de la création du fichier de commande:', error);
        return false;
    }
}

// Fonction pour recharger les commandes
async function reloadCommands() {
    try {
        delete require.cache[require.resolve('../commands')];

        const commandFiles = await fs.readdir(path.join(process.cwd(), 'commands'));
        for (const file of commandFiles) {
            if (file.endsWith('.js')) {
                delete require.cache[require.resolve(`../commands/${file}`)];
            }
        }

        await loadCommands();

        console.log('Commandes rechargées avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors du rechargement des commandes:', error);
        return false;
    }
}

// Configuration des routes de gestion des commandes
app.post('/api/commands', checkPermissions, async (req, res) => {
    try {
        const { name, description, options, defaultMemberPermissions, dmPermission, code } = req.body;
        const guild = client.guilds.cache.first();

        if (!guild) {
            return res.status(404).json({ error: 'Aucun serveur trouvé' });
        }

        const cleanName = name.replace(/^\/+/, '').toLowerCase();

        const command = await guild.commands.create({
            name: cleanName,
            description,
            options,
            defaultMemberPermissions: defaultMemberPermissions ? BigInt(defaultMemberPermissions) : null,
            dmPermission
        });

        if (code) {
            const fileCreated = await createCommandFile(cleanName, code);
            if (!fileCreated) {
                return res.status(500).json({ error: 'Erreur lors de la création du fichier de commande' });
            }

            const reloaded = await reloadCommands();
            if (!reloaded) {
                console.warn('Impossible de recharger les commandes après la création');
            }
        }

        res.json({
            success: true,
            command: {
                id: command.id,
                name: command.name,
                description: command.description,
                options: command.options,
                defaultMemberPermissions: command.defaultMemberPermissions?.toString(),
                dmPermission: command.dmPermission
            }
        });
    } catch (error) {
        console.error('Erreur lors de la création de la commande:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la commande' });
    }
});

app.put('/api/commands/:id', checkPermissions, async (req, res) => {
    try {
        const {
            name: newName,
            description: newDescription,
            options: newOptions,
            defaultMemberPermissions: newPermissions,
            dmPermission: newDmPermission,
            code: newCode,
            category: newCategory
        } = req.body;
        const guild = client.guilds.cache.first();

        if (!guild) {
            return res.status(404).json({ error: 'Aucun serveur trouvé' });
        }

        const cleanName = newName.replace(/^\/+/, '').toLowerCase();
        const permissions = newPermissions ? BigInt(newPermissions) : null;

        const command = await guild.commands.edit(req.params.id, {
            name: cleanName,
            description: newDescription,
            options: newOptions,
            defaultMemberPermissions: permissions,
            dmPermission: newDmPermission
        });

        if (newCode) {
            const filePath = path.join(process.cwd(), 'commands', `${cleanName}.js`);
            await fs.writeFile(filePath, newCode);
        }

        const updatedCommand = {
            id: command.id,
            name: command.name,
            description: command.description,
            options: command.options,
            defaultMemberPermissions: newPermissions,
            dmPermission: command.dmPermission,
            category: newCategory || 'OTHER',
            type: command.type || 1,
            code: newCode || ''
        };

        if (command.name !== newName) {
            client.commands.delete(newName);
        }

        client.commands.set(command.name, updatedCommand);

        const commands = Array.from(client.commands.values()).map(cmd => ({
            id: cmd.id,
            name: cmd.name,
            description: cmd.description,
            options: cmd.options,
            defaultMemberPermissions: cmd.defaultMemberPermissions,
            dmPermission: cmd.dmPermission,
            category: cmd.category || 'OTHER',
            type: cmd.type || 1
        }));

        io.emit('commandsUpdate', commands);
        await loadCommands();

        res.json({
            success: true,
            command: updatedCommand
        });
    } catch (error) {
        console.error('Erreur lors de la modification de la commande:', error);
        res.status(500).json({ error: 'Erreur lors de la modification de la commande' });
    }
});

app.delete('/api/commands/:id', checkPermissions, async (req, res) => {
    try {
        const guild = client.guilds.cache.first();

        if (!guild) {
            return res.status(404).json({ error: 'Aucun serveur trouvé' });
        }

        await guild.commands.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression de la commande:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la commande' });
    }
});

// Fonction pour envoyer un message
async function sendBotMessage(channelId, content) {
    try {
        const guild = client.guilds.cache.first();
        if (!guild) {
            throw new Error('Aucun serveur trouvé');
        }

        const channel = await guild.channels.fetch(channelId);
        if (!channel) {
            throw new Error('Canal non trouvé');
        }

        const message = await channel.send(content);
        return {
            success: true,
            message: {
                id: message.id,
                content: message.content,
                timestamp: message.createdTimestamp
            }
        };
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Configuration de la route d'envoi de message
app.post('/api/send-message', checkPermissions, async (req, res) => {
    try {
        const { channelId, content } = req.body;

        if (!channelId || !content) {
            return res.status(400).json({
                success: false,
                error: 'ID du canal et contenu requis'
            });
        }

        const result = await sendBotMessage(channelId, content);

        if (result.success) {
            addActivityLog('message', `Message envoyé dans le canal ${channelId}`, {
                channelId,
                content
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'envoi du message'
        });
    }
});

// Démarrage du serveur
const PORT = process.env.DASHBOARD_PORT || 3000;
server.listen(PORT, () => {
    console.log(`Dashboard en ligne sur le port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

// Connexion du bot
client.login(process.env.BOT_TOKEN); 