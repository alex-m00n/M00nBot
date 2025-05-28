import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// Configuration de la commande
export const data = new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Propose une suggestion pour le serveur')
    .addStringOption(option =>
        option.setName('suggestion')
            .setDescription('Votre suggestion')
            .setRequired(true));

// Exécution de la commande
export async function execute(interaction) {
    const suggestion = interaction.options.getString('suggestion');
    const suggestionChannel = interaction.guild.channels.cache.get('1147977872414351380');

    if (!suggestionChannel) {
        return interaction.reply({
            content: '❌ Le salon de suggestions n\'est pas configuré.',
            flags: 64
        });
    }

    // Création de l'embed de suggestion
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('💡 Nouvelle suggestion')
        .setDescription(suggestion)
        .addFields(
            { name: 'Proposé par', value: interaction.user.tag }
        )
        .setFooter({ text: 'Réagissez pour voter' })
        .setTimestamp();

    try {
        // Envoi de la suggestion
        const message = await suggestionChannel.send({ embeds: [embed] });
        await message.react('👍');
        await message.react('👎');

        await interaction.reply({
            content: '✅ Votre suggestion a été envoyée !',
            flags: 64
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi de la suggestion:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de l\'envoi de la suggestion.',
            flags: 64
        });
    }
}