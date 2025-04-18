import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('doc')
    .setDescription('Envoie la documentaion du bot.');
    
export async function execute(interaction) {
    await interaction.reply({ content: 'Je suis un bot créé par AlexM00n, prêt à répondre à tes commandes ! 🤖\nLien de la documentation : https://m00n-bot.vercel.app', flags : 64 });
}