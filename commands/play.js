import { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Joue une musique depuis YouTube')
    .addStringOption(option =>
        option.setName('query')
            .setDescription('URL de la musique')
            .setRequired(true)
    );

export async function execute(interaction) {
    const client = interaction.client;
    const distube = client.distube;
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
        return interaction.reply({ content: '🔊 Tu dois être dans un salon vocal.', flags: 64 });
    }

    await interaction.deferReply();

    try {
        console.log(`Requête de musique : ${query}`);

        const queue = distube.getQueue(voiceChannel);

        if (queue) {
            await distube.play(voiceChannel, query, {
                member: interaction.member,
                textChannel: interaction.channel,
                interaction,
            });

            // Récupérer la liste de lecture actuelle
            const playlist = queue.songs.map((song, index) => `${index + 1}. ${song.name} - ${song.formattedDuration}`).join('\n');

            // Créer un embed pour la liste de lecture
            const playlistEmbed = new EmbedBuilder()
                .setTitle('🎶 Liste de lecture actuelle')
                .setDescription(playlist)
                .setColor('#0099ff');

            return interaction.followUp({ content: `🎶 La musique a été ajoutée à la liste de lecture : ${query}`, embeds: [playlistEmbed], flags: 64 });
        }

        // Si aucune musique n'est en cours, démarrez la lecture
        await distube.play(voiceChannel, query, {
            member: interaction.member,
            textChannel: interaction.channel,
            interaction,
        });

        // Récupérer la file d'attente mise à jour
        const updatedQueue = distube.getQueue(voiceChannel);
        const currentSong = updatedQueue.songs[0];

        // Vérifiez si l'objet currentSong est défini
        if (!currentSong) {
            return interaction.followUp({ content: '❌ Impossible de récupérer les informations de la musique.', flags: 64 });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎶 Musique en cours de lecture !')
            .setDescription(`La musique est maintenant en cours de lecture.`)
            .addFields(
                { name: 'Titre', value: currentSong.name || 'Inconnu', inline: true },
                { name: 'Durée', value: currentSong.formattedDuration || 'Inconnu', inline: true },
                { name: 'Auteur', value: currentSong.uploader?.name || 'Inconnu', inline: true },
                { name: 'Lien', value: `[Cliquez ici](${query})`, inline: true }
            )
            .setThumbnail(currentSong.thumbnail || '')
            .setColor('#0099ff');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setEmoji('⏮')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('pause')
                    .setEmoji('⏸')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('resume')
                    .setEmoji('▶')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('stop')
                    .setEmoji('⏹')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setEmoji('⏭')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.followUp({ embeds: [embed], components: [row] });
    } catch (error) {
        console.error(error);
        interaction.reply({ content: '❌ Une erreur est survenue en essayant de jouer cette musique.', flags: 64 });
    }
}

export async function pause(interaction) {
    const client = interaction.client;
    const distube = client.distube;
    const queue = distube.getQueue(interaction);

    if (!queue) {
        return interaction.reply({ content: '❌ Il n\'y a pas de musique en cours de lecture.', flags: 64 });
    }

    distube.pause(interaction);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('pause')
                .setEmoji('⏸')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('resume')
                .setEmoji('▶')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('stop')
                .setEmoji('⏹')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.update({ components: [row] });
    interaction.followUp({ content: '⏸️ La musique a été mise en pause.', flags: 64 });
}

export async function resume(interaction) {
    const client = interaction.client;
    const distube = client.distube;
    const queue = distube.getQueue(interaction);

    if (!queue) {
        return interaction.reply({ content: '❌ Il n\'y a pas de musique en pause.', flags: 64 });
    }

    distube.resume(interaction);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('pause')
                .setEmoji('⏸')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('resume')
                .setEmoji('▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('stop')
                .setEmoji('⏹')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.update({ components: [row] });
    interaction.followUp({ content: '▶️ La musique a repris.', flags: 64 });
}

export async function stop(interaction) {
    const client = interaction.client;
    const distube = client.distube;
    const queue = distube.getQueue(interaction);

    if (!queue) {
        return interaction.reply({ content: '❌ Il n\'y a pas de musique en cours de lecture.', flags: 64 });
    }

    distube.stop(interaction);

    const voiceChannel = interaction.member.voice.channel;
    if (voiceChannel) {
        voiceChannel.leave();
    }

    interaction.reply({ content: '⏹️ La musique a été arrêtée et le bot a quitté le canal vocal.', flags: 64 });
}

export async function previous(interaction) {
    const client = interaction.client;
    const distube = client.distube;
    const queue = distube.getQueue(interaction);

    if (!queue || queue.previousSongs.length === 0) {
        return interaction.reply({ content: '❌ Il n\'y a pas de piste précédente.', flags: 64 });
    }

    distube.previous(interaction);
    interaction.reply({ content: '⏮️ Piste précédente.', flags: 64 });
}

export async function next(interaction) {
    const client = interaction.client;
    const distube = client.distube;
    const queue = distube.getQueue(interaction);

    if (!queue || queue.songs.length <= 1) {
        return interaction.reply({ content: '❌ Il n\'y a pas de piste suivante.', flags: 64 });
    }

    distube.skip(interaction);
    interaction.reply({ content: '⏭️ Piste suivante.', flags: 64 });
}