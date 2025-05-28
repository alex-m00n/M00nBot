import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

// Configuration de la commande
export const data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime un nombre spécifié de messages')
    .addIntegerOption(option =>
        option.setName('nombre')
            .setDescription('Nombre de messages à supprimer (1-100)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

// Exécution de la commande
export async function execute(interaction) {
    const amount = interaction.options.getInteger('nombre');

    try {
        // Suppression des messages
        const messages = await interaction.channel.bulkDelete(amount, true);
        
        // Confirmation de la suppression
        const reply = await interaction.reply({
            content: `✅ ${messages.size} message(s) supprimé(s).`,
            flags : 64
        });

        // Suppression du message de confirmation après 5 secondes
        setTimeout(() => {
            reply.delete().catch(console.error);
        }, 5000);
    } catch (error) {
        console.error('Erreur lors de la suppression des messages:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de la suppression des messages.',
            flags : 64
        });
    }
}