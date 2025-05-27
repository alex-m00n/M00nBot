import { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';

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

            const playlist = queue.songs.map((song, index) => `${index + 1}. ${song.name} - ${song.formattedDuration}`).join('\n');

            const playlistEmbed = new EmbedBuilder()
                .setTitle('🎶 Liste de lecture actuelle')
                .setDescription(playlist)
                .setColor('#0099ff');

            await interaction.followUp({ content: `🎶 La musique a été ajoutée à la liste de lecture : ${query}`, embeds: [playlistEmbed], flags: 64 });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setEmoji('⏮')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(!queue || queue.previousSongs.length === 0),
                    new ButtonBuilder()
                        .setCustomId('pause')
                        .setEmoji('⏸')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('resume')
                        .setEmoji('▶')
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stop')
                        .setEmoji('⏹')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setEmoji('⏭')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(!queue || queue.songs.length <= 1)
                );

            await interaction.followUp({ embeds: [playlistEmbed], components: [row] });
        }

        await distube.play(voiceChannel, query, {
            member: interaction.member,
            textChannel: interaction.channel,
            interaction,
        });

        const updatedQueue = distube.getQueue(voiceChannel);
        const currentSong = updatedQueue.songs[0];

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
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!queue || queue.previousSongs.length === 0),
                new ButtonBuilder()
                    .setCustomId('pause')
                    .setEmoji('⏸')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('resume')
                    .setEmoji('▶')
                    .setDisabled(true)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('stop')
                    .setEmoji('⏹')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setEmoji('⏭')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!queue || queue.songs.length <= 1)
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
                .setCustomId('previous')
                .setEmoji('⏮')
                .setStyle(ButtonStyle.Secondary),
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
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('next')
                .setEmoji('⏭')
                .setStyle(ButtonStyle.Secondary)
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
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('stop')
                .setEmoji('⏹')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('next')
                .setEmoji('⏭')
                .setStyle(ButtonStyle.Secondary)
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

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
        return interaction.reply({ content: '❌ Vous devez être dans un salon vocal pour arrêter la musique.', flags: 64 });
    }

    try {
        distube.stop(interaction);

        const member = interaction.guild.members.cache.get(client.user.id);
        if (member && member.voice) {
            await member.voice.disconnect();
        }

        return interaction.reply({ content: '⏹️ La musique a été arrêtée et le bot a quitté le canal vocal.', flags: 64 });
    } catch (error) {
        console.error('Erreur lors de l\'arrêt de la musique:', error);
        return interaction.reply({ content: '❌ Une erreur est survenue lors de l\'arrêt de la musique.', flags: 64 });
    }
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