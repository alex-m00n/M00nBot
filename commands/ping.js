import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Renvoie Pong et la latence du bot.');

export async function execute(interaction) {
    const startTime = Date.now();
    await interaction.reply('Calcul de la latence...');
    const endTime = Date.now();
    const botLatency = endTime - startTime;
    const apiLatency = Math.round(interaction.client.ws.ping);
    await interaction.editReply({content:`🏓 Pong !\nLatence du bot : **${botLatency}ms**\nLatence de l'API : **${apiLatency}ms**`, flags : 64});
}