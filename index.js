import { ActionRowBuilder, ActivityType, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, GatewayIntentBits, PermissionsBitField, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { DisTube } from 'distube';
import { YtDlpPlugin } from '@distube/yt-dlp';
import { pause, resume, stop, previous, next } from './commands/play.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commandModules = {};

const CHANNEL_IDS = {
    TOTAL_MEMBERS: "1321963617117012048",
    MEMBERS: "1321963655201292340",
    BOTS: "1321963676013690880",
    WELCOME: "1087789238306754751",
    RULES: "1087777468515098694",
    TICKETS: {
        PARENT: "1353461256316518410",
        ARCHIVE: "1360580662263812350"
    }
};

const ROLE_IDS = {
    MEMBER: "1101378928079294574",
    UNVERIFIED: "1101381543173304371",
    STAFF: "1103256186326892554"
};

(async () => {
    try {
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = await import(`file://${filePath}`);
            if (command.data && command.data.toJSON) {
                commands.push(command.data.toJSON());
                commandModules[command.data.name] = command;
            }
        }

        const rest = new REST({ version: '10' }).setToken(TOKEN);
        console.log('🔄 Enregistrement des slash commands...');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('✅ Slash commands enregistrées avec succès.');
        console.log('🔄 Enregistrement des context menu commands...');
        console.log('✅ Context menu commands enregistrées avec succès.');
        console.log('🔄 Enregistrement des boutons...');
        console.log('✅ Bouttons enregistrés avec succès.');
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des commandes :', error);
    }
})();

client.once('ready', async () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);

    const guild = client.guilds.cache.get(GUILD_ID);
    await guild.members.fetch();

    const nmbbot = guild.members.cache.filter(member => member.user.bot).size;
    const nmbhu = guild.members.cache.filter(member => !member.user.bot).size;
    const total = guild.memberCount;

    client.channels.cache.get("1321963617117012048").setName(`🗣️Total membres: ${total}🤖`);
    client.channels.cache.get("1321963655201292340").setName(`🗣️Membres: ${nmbhu}🗣️`);
    client.channels.cache.get("1321963676013690880").setName(`🤖Bot: ${nmbbot}🤖`);

    let status = [
        {
            type: ActivityType.Competing,
            name: "La vie du serveur !",
            url: "https://discord.gg/wpXyCHuyb6",
            status: "online"
        },
        {
            type: ActivityType.Playing,
            name: "Vous Surveiller !",
            url: "https://twitch.tv/alexm00ntv",
            status: "dnd"
        },

        {
            type: ActivityType.Listening,
            name: "Vos demandes !",
            url: "https://twitch.tv/alexm00ntv",
            status: "idle"
        },

        {
            type: ActivityType.Streaming,
            name: "Le résutat de vos commandes !",
            url: "https://twitch.tv/alexm00ntv",
            status: "online"
        },

        {
            type: ActivityType.Watching,
            name: "Youtube|@AlexM00nTV",
            url: "https://youtube.com/@AlexM00nTV",
            status: "dnd"
        },

        {
            type: ActivityType.Streaming,
            name: "Twitch|alexm00ntv",
            url: "https://twitch.tv/alexm00ntv",
            status: "online"
        },

        {
            type: ActivityType.Watching,
            name: client.guilds.valueOf().size + " serveur",
            status: "dnd"
        },
    ];

    setInterval(() => {
        try {
            const nmbbot = guild.members.cache.filter(member => member.user.bot).size;
            const nmbhu = guild.members.cache.filter(member => !member.user.bot).size;
            const total = guild.memberCount;

            console.log("=== DÉBUT MISE À JOUR DES SALONS ===");
            console.log("Nombre de membres humains:", nmbhu);
            console.log("Nombre de bots:", nmbbot);
            console.log("Total:", total);

            const totalChannel = client.channels.cache.get("1321963617117012048");
            const membersChannel = client.channels.cache.get("1321963655201292340");
            const botChannel = client.channels.cache.get("1321963676013690880");

            if (membersChannel) {
                membersChannel.setName(`🗣️Membres: ${nmbhu}🗣️`)
                    .then(() => console.log("✅ Salon membres mis à jour"))
                    .catch(error => console.error("❌ Erreur salon membres:", error));
            }
            if (totalChannel) {
                totalChannel.setName(`🗣️Total membres: ${total}🤖`)
                    .then(() => console.log("✅ Salon total mis à jour"))
                    .catch(error => console.error("❌ Erreur salon total:", error));
            }
            if (botChannel) {
                botChannel.setName(`🤖Bot: ${nmbbot}🤖`)
                    .then(() => console.log("✅ Salon bots mis à jour"))
                    .catch(error => console.error("❌ Erreur salon bots:", error));
            }

            console.log("=== FIN MISE À JOUR DES SALONS ===");
        } catch (error) {
            console.error("❌ ERREUR CRITIQUE lors de la mise à jour des salons:", error);
        }

        let random = Math.floor(Math.random() * status.length);
        client.user.setActivity(status[random]);
        client.user.setStatus(status[random].status);
    }, 10000);
});

client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    plugins: [
        new YtDlpPlugin({
            update: true,
            ytDlpOptions: {
                format: 'bestaudio/best',
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                addHeader: [
                    'referer:youtube.com',
                    'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ],
                geoBypass: true,
                geoVerificationProxy: 'auto',
                proxy: 'auto',
                extractAudio: true,
                audioFormat: 'mp3',
                audioQuality: 0,
                recodeVideo: 'mp4'
            }
        })
    ]
});

// Ajout des événements de débogage pour DisTube
client.distube.on('error', (channel, error) => {
    console.error('Erreur DisTube:', error);
    if (channel) {
        channel.send(`❌ Une erreur est survenue: ${error.message}`);
    }
});

client.distube.on('playSong', (queue, song) => {
    console.log(`Lecture de la chanson: ${song.name}`);
});

client.distube.on('addSong', (queue, song) => {
    console.log(`Chanson ajoutée: ${song.name}`);
});

client.distube.on('disconnect', (queue) => {
    console.log('Déconnexion du canal vocal');
});

client.on("guildMemberAdd", async (member) => {
    try {
        await updateMemberCounters(member.guild);
        console.log("✅ Un membre est arrivé");
        await member.roles.add(ROLE_IDS.UNVERIFIED);
    } catch (error) {
        console.error("❌ Erreur lors de l'arrivée d'un membre:", error);
    }
});

client.on("guildMemberRemove", async (member) => {
    try {
        console.log("❌ Un membre est parti");
        await updateMemberCounters(member.guild);

        const embedAurevoir = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle(`À bientôt sur le serveur __${member.guild.name}__! 🎉`)
            .setDescription(`${member.user} a quitté le serveur !`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Nous sommes maintenant ${member.guild.members.cache.filter(member => !member.user.bot).size} sur le serveur !` });

        await client.channels.cache.get(CHANNEL_IDS.WELCOME).send({ embeds: [embedAurevoir] });
    } catch (error) {
        console.error("❌ Erreur lors du départ d'un membre:", error);
    }
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isCommand()) {
            const command = interaction.commandName;
            if (commandModules[command]) {
                try {
                    await interaction.deferReply();
                    await commandModules[command].execute(interaction);
                } catch (error) {
                    console.error(`Erreur lors de l'exécution de la commande ${command}:`, error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: "Une erreur est survenue lors du traitement de votre demande.", flags: 64 });
                    } else {
                        await interaction.followUp({ content: "Une erreur est survenue lors du traitement de votre demande.", flags: 64 });
                    }
                }
            }
            console.log('/' + command + ' a été utilisé !');
        }
        else if (interaction.isUserContextMenuCommand()) {
            const command = interaction.commandName;
            if (commandModules[command]) {
                try {
                    await interaction.deferReply();
                    await commandModules[command].execute(interaction);
                } catch (error) {
                    console.error(`Erreur lors de l'exécution de la commande contextuelle ${command}:`, error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: "Une erreur est survenue lors du traitement de votre demande.", flags: 64 });
                    } else {
                        await interaction.followUp({ content: "Une erreur est survenue lors du traitement de votre demande.", flags: 64 });
                    }
                }
            }
            console.log('ContextMenuCommand ' + command + ' a été utilisé !');
        }
        else if (interaction.isButton()) {
            try {
                await interaction.deferUpdate();
                switch (interaction.customId) {
                    case "verifie":
                        await handleVerification(interaction);
                        break;
                    case "createtickets":
                        await handleTicketCreation(interaction);
                        break;
                    case "closetickets":
                        await handleTicketClosure(interaction);
                        break;
                    case "pause":
                        await pause(interaction);
                        break;
                    case "resume":
                        await resume(interaction);
                        break;
                    case "stop":
                        await stop(interaction);
                        break;
                    case "previous":
                        await previous(interaction);
                        break;
                    case "next":
                        await next(interaction);
                        break;
                }
                console.log('Bouton ' + interaction.customId + ' a été utilisé !');
            } catch (error) {
                console.error(`Erreur lors du traitement du bouton ${interaction.customId}:`, error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: "Une erreur est survenue lors du traitement de votre demande.", flags: 64 });
                } else {
                    await interaction.followUp({ content: "Une erreur est survenue lors du traitement de votre demande.", flags: 64 });
                }
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors du traitement de l'interaction:", error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "Une erreur est survenue lors du traitement de votre demande.", flags: 64 });
            } else {
                await interaction.followUp({ content: "Une erreur est survenue lors du traitement de votre demande.", flags: 64 });
            }
        } catch (e) {
            console.error("❌ Impossible de répondre à l'interaction:", e);
        }
    }
});

async function handleVerification(interaction) {
    const embedBienvenue = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(`Bienvenue sur le serveur __${interaction.guild.name}__! 🎉`)
        .setDescription(`Salut ${interaction.member.user}, ravi de te voir parmi nous !\n\n📜 Lis le <#${CHANNEL_IDS.RULES}> et amuse-toi bien !`)
        .setThumbnail(interaction.member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Nous sommes maintenant ${interaction.member.guild.members.cache.filter(member => !member.user.bot).size} sur le serveur !` });

    await interaction.member.roles.remove(ROLE_IDS.UNVERIFIED);
    await interaction.member.roles.add(ROLE_IDS.MEMBER);
    await client.channels.cache.get(CHANNEL_IDS.WELCOME).send({ embeds: [embedBienvenue] });
    await interaction.member.send({ embeds: [embedBienvenue] });
}

async function handleTicketCreation(interaction) {
    const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.member.id}`,
        type: 0,
        parent: CHANNEL_IDS.TICKETS.PARENT,
        permissionOverwrites: [
            {
                id: interaction.guild.roles.everyone,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: interaction.member.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
            {
                id: ROLE_IDS.STAFF,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            }
        ]
    });

    const embed = new EmbedBuilder()
        .setAuthor({
            name: "M00nBot",
            url: "https://m00n-bot.vercel.app",
            iconURL: interaction.client.user.avatarURL(),
        })
        .setTitle("Ticket créé")
        .addFields(
            { name: "Salut <@" + interaction.member.id + ">", value: "Explique nous pourquoi tu as créé ce ticket sous cette forme :", inline: false },
            { name: "Catégorie :", value: "(Demande d'information/bug/problème avec un ou d'autres membre(s)/demande pour devenir modo ...)", inline: false },
            { name: "Explication :", value: "...", inline: false }
        )
        .setThumbnail(interaction.guild.iconURL())
        .setColor("#0099ff");

    const btn = new ButtonBuilder()
        .setCustomId("closetickets")
        .setLabel("Fermer le ticket")
        .setEmoji("✖️")
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(btn);
    await ticketChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Le ticket a été créé !\n<#' + ticketChannel.id + '>', flags: 64 });
}

async function handleTicketClosure(interaction) {
    try {
        await interaction.channel.setParent(CHANNEL_IDS.TICKETS.ARCHIVE);
        await interaction.reply({ content: `Le ticket a été archivé`, flags: 64 });
    } catch (error) {
        console.error('Erreur lors de la fermeture du ticket:', error);
        await interaction.reply({ content: 'Une erreur est survenue lors de l\'archivage.', flags: 64 });
    }
}

async function updateMemberCounters(guild) {
    try {
        const nmbbot = guild.members.cache.filter(member => member.user.bot).size;
        const nmbhu = guild.members.cache.filter(member => !member.user.bot).size;
        const total = guild.memberCount;

        console.log("=== DÉBUT MISE À JOUR DES SALONS ===");
        console.log("Nombre de membres humains:", nmbhu);
        console.log("Nombre de bots:", nmbbot);
        console.log("Total:", total);

        const channels = {
            total: client.channels.cache.get(CHANNEL_IDS.TOTAL_MEMBERS),
            members: client.channels.cache.get(CHANNEL_IDS.MEMBERS),
            bots: client.channels.cache.get(CHANNEL_IDS.BOTS)
        };

        if (channels.members) {
            await channels.members.setName(`🗣️Membres: ${nmbhu}🗣️`);
            console.log("✅ Salon membres mis à jour");
        }
        if (channels.total) {
            await channels.total.setName(`🗣️Total membres: ${total}🤖`);
            console.log("✅ Salon total mis à jour");
        }
        if (channels.bots) {
            await channels.bots.setName(`🤖Bot: ${nmbbot}🤖`);
            console.log("✅ Salon bots mis à jour");
        }

        console.log("=== FIN MISE À JOUR DES SALONS ===");
    } catch (error) {
        console.error("❌ ERREUR CRITIQUE lors de la mise à jour des salons:", error);
    }
}

client.login(TOKEN).catch((err) => {
    console.error('❌ Impossible de se connecter :\n', err);
});

export { commandModules };