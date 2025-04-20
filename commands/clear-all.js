import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('clear-all')
    .setDescription('Supprime tous les messages du salon')
    .setDefaultMemberPermissions('8192');

export async function execute(interaction) {
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    await interaction.channel.bulkDelete(messages, true);
    interaction.reply({ content: '✅ Tous les messages ont été supprimés', flags : 64 });
}