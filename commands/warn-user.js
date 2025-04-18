import { ContextMenuCommandBuilder } from 'discord.js';

export const data = new ContextMenuCommandBuilder()
    .setName('Warn l\'utilisateur')
    .setType(2);

export async function execute(interaction) {
    const warnchannel = interaction.guild.channels.cache.get('1147977872414351380');
    const user = interaction.targetUser;

    const sentMessage = await warnchannel.send("⚠️ <@"+ interaction.member+"> a warn <@"+user+">");
    sentMessage.react('✅')
    interaction.reply({ content: `✅ Ton warn a été envoyée au modo !`, flags : 64})
}