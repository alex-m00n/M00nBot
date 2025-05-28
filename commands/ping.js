import { SlashCommandBuilder } from 'discord.js';

// Configuration de la commande
export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Affiche la latence du bot');

// Exécution de la commande
export async function execute(interaction) {
    const sent = await interaction.reply({ content: 'Calcul du ping...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply({ content: `🏓 Pong!\nLatence du bot: ${latency}ms\nLatence de l'API: ${apiLatency}ms`, flags: 64 });
}