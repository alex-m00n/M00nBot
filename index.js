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

(async () => {
    for (const file of commandFiles) {
        const command = await import(`file://${path.join(commandsPath, file)}`);
        commands.push(command.data.toJSON());
        commandModules[command.data.name] = command;
    }

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
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

    client.channels.cache.get("1321963617117012048").setName("🗣️Total membres: " + total + "🤖");
    client.channels.cache.get("1321963655201292340").setName("🗣️ Membres: " + nmbhu + " 🗣️");
    client.channels.cache.get("1321963676013690880").setName("🤖 Bot: " + nmbbot + " 🤖");


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

            const totalChannel = client.channels.cache.get("1321963617117012048");
            console.log("Tentative de mise à jour du salon de tous les membres (robot+membres)...");
            if (totalChannel) {
                console.log("Salon de tous les membres (robot+membres) trouvé : " + totalChannel.name);
                console.log("Nombre de tous les membres (robot+membres) : " + total);
                totalChannel.setName("🗣️Total membres: " + total + "🤖")
                    .then(() => console.log("Salon de tous les membres (robot+membres) mis à jour avec succès."))
                    .catch(error => console.error("Erreur lors de la mise à jour du salon de tous les membres (robot+membres) :", error));
            } else {
                console.error("Salon de tous les membres (robot+membres) non trouvé.");
            }

            const membersChannel = client.channels.cache.get("1321963655201292340");
            console.log("Tentative de mise à jour du salon des membres...");
            if (membersChannel) {
                console.log("Salon des membres trouvé : " + membersChannel.name);
                console.log("Nombre de membres humains : " + nmbhu);
                membersChannel.setName("🗣️Membres: " + nmbhu + "🗣️")
                    .then(() => console.log("Salon des membres mis à jour avec succès."))
                    .catch(error => console.error("Erreur lors de la mise à jour du salon des membres :", error));
            } else {
                console.error("Salon des membres non trouvé.");
            }

            const botChannel = client.channels.cache.get("1321963676013690880");
            console.log("Tentative de mise à jour du salon des bots...");
            if (botChannel) {
                console.log("Salon des bots trouvé : " + botChannel.name);
                console.log("Nombre de bots : " + nmbbot);
                botChannel.setName("🤖Bot: " + nmbbot + "🤖")
                    .then(() => console.log("Salon des bots mis à jour avec succès."))
                    .catch(error => console.error("Erreur lors de la mise à jour du salon des bots :", error));
            } else {
                console.error("Salon des bots non trouvé.");
            }

            console.log("Statistiques mises à jour : Total membres: " + total + ", Membres: " + nmbhu + ", Bots: " + nmbbot);
        } catch (error) {
            console.error("Erreur lors de la mise à jour des salons statistiques :", error);
        }


        let random = Math.floor(Math.random() * status.length);
        client.user.setActivity(status[random]);
        client.user.setStatus(status[random].status);
    }, 10000);
});

client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    plugins: [new YtDlpPlugin()]
});


client.on("guildMemberAdd", (member) => {

    const nmbbot = client.guilds.cache.get(GUILD_ID).members.cache.filter(member => member.user.bot).size;
    const nmbhu = client.guilds.cache.get(GUILD_ID).members.cache.filter(member => !member.user.bot).size;
    const total = client.guilds.cache.get(GUILD_ID).memberCount;

    client.channels.cache.get("1321963617117012048").setName("🗣️Total membres: " + total + "🤖")
    client.channels.cache.get("1321963655201292340").setName("🗣️Membres: " + nmbhu + "🗣️")
    client.channels.cache.get("1321963676013690880").setName("🤖Bot: " + nmbbot + "🤖")

    console.log("✅ Un membre est arrivé")

    member.roles.add("1101381543173304371")
});

client.on("guildMemberRemove", (member) => {
    console.log("❌ Un membre est partit")

    const nmbbot = client.guilds.cache.get(GUILD_ID).members.cache.filter(member => member.user.bot).size;
    const nmbhu = client.guilds.cache.get(GUILD_ID).members.cache.filter(member => !member.user.bot).size;
    const total = client.guilds.cache.get(GUILD_ID).memberCount;

    client.channels.cache.get("1321963617117012048").setName("🗣️Total membres: " + total + "🤖")
    client.channels.cache.get("1321963655201292340").setName("🗣️Membres: " + nmbhu + "🗣️")
    client.channels.cache.get("1321963676013690880").setName("🤖Bot: " + nmbbot + "🤖")

    const embedAurevoir = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle(`À bientôt sur le serveur __${member.guild.name}__! 🎉`)
        .setDescription(`${member.user} a quitté le serveur !`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Nous sommes maintenant ${member.guild.members.cache.filter(member => !member.user.bot).size} sur le serveur !` });

    client.channels.cache.get('1087789238306754751').send({ embeds: [embedAurevoir] })
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const command = interaction.commandName;
        if (commandModules[command]) {
            await commandModules[command].execute(interaction);
        }
        console.log('/' + command + ' a été utilisé !')
    }

    else if (interaction.isUserContextMenuCommand()) {
        const command = interaction.commandName;
        if (commandModules[command]) {
            await commandModules[command].execute(interaction);
        }
        console.log('ContextMenuCommand ' + command + ' a été utilisé !')
    }

    else if (interaction.isButton()) {
        if (interaction.customId === "verifie") {
            const embedBienvenue = new EmbedBuilder()
                .setColor("#00ff00")
                .setTitle(`Bienvenue sur le serveur __${interaction.guild.name}__! 🎉`)
                .setDescription(`Salut ${interaction.member.user}, ravi de te voir parmi nous !\n\n📜 Lis le <#1087777468515098694> et amuse-toi bien !`)
                .setThumbnail(interaction.member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Nous sommes maintenant ${interaction.member.guild.members.cache.filter(member => !member.user.bot).size} sur le serveur !` });

            interaction.member.roles.remove("1101381543173304371")
            interaction.member.roles.add("1101378928079294574")
            client.channels.cache.get('1087789238306754751').send({ embeds: [embedBienvenue] })
            interaction.member.send({ embeds: [embedBienvenue] })
        }
        else if (interaction.customId === "createtickets") {
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.member.id}`,
                type: 0,
                parent: '1353461256316518410',
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
                        id: '1103256186326892554',
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: "MØØN Bot",
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
            ticketChannel.send({ embeds: [embed], components: [row] });
            interaction.reply({ content: 'Le ticket a été créé !\n<#' + ticketChannel.id + '>', flags: 64 });
        }

        else if (interaction.customId === "closetickets") {
            const ticketChannel = interaction.channel;
            const categoryId = '1360580662263812350';

            await ticketChannel.setParent(categoryId)
                .then(() => {
                    interaction.reply({ content: `Le ticket a été archivé`, flags: 64 });
                })
                .catch(err => {
                    console.error('Erreur lors du changement de catégorie :', err);
                    interaction.reply({ content: 'Une erreur est survenue lors de l\'achivage.', flags: 64 });
                });
        }

        else if (interaction.customId === 'pause') {
            await pause(interaction);
        }

        else if (interaction.customId === 'resume') {
            await resume(interaction)
        }
        
        else if (interaction.customId === 'stop') {
            await stop(interaction);
        }

        else if (interaction.customId === 'previous') {
            await previous(interaction);
        }

        else if (interaction.customId === 'next') {
            await next(interaction);
        }
        
        console.log('Bouton ' + interaction.customId + ' a été utilisé !')
    }
});

client.login(TOKEN).catch((err) => {
    console.error('❌ Impossible de se connecter :\n', err);
});

export { commandModules };