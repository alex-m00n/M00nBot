import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Faire une suggestion')
    .addStringOption(option =>
        option.setName('suggestion')
            .setDescription('La suggestion')
            .setRequired(true));

export async function execute(interaction) {
    const suggestchannel = interaction.guild.channels.cache.get('1104063040359514202');
    const message = interaction.options.getString('suggestion');
    const member = interaction.member;

    if (!suggestchannel) {
        return interaction.reply({ content: '❌ Le salon de suggestions est introuvable.', flags : 64});
    }

    await interaction.reply({ content: `✅ Ta suggestion a été envoyée dans <#${suggestchannel.id}> !`, flags : 64});
    const sentMessage = await suggestchannel.send(`📢 **Suggestion de <@${member.id}> :**\n${message}\n\n🔹 Qu'en pensez-vous ?`);
    await sentMessage.react('✅');
    await sentMessage.react('❌');
}