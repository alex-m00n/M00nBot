import { SlashCommandBuilder } from 'discord.js';

// Configuration de la commande
export const data = new SlashCommandBuilder()
    .setName('doc')
    .setDescription('Affiche le lien vers la documentation du bot');

// Exécution de la commande
export async function execute(interaction) {
    await interaction.reply({ content: '📚 Documentation: https://m00n-bot.vercel.app', flags: 64 });
}