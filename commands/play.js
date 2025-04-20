import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

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

        const song = await distube.play(voiceChannel, query, {
            member: interaction.member,
            textChannel: interaction.channel,
            interaction,
        });

        const embed = new EmbedBuilder()
            .setTitle('🎶 Musique en cours de lecture !')
            .setDescription(`La musique est maintenant en cours de lecture.`)
            .addFields({ name: 'Lien', value: query })
            .setColor('#0099ff')

        await interaction.followUp({ embeds: [embed] });
    } catch (error) {
        console.error(error);
        interaction.reply({ content: '❌ Une erreur est survenue en essayant de jouer cette musique.', flags: 64 });
    }
}