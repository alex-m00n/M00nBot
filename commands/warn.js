import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn un utilisateur.')
    .addUserOption(option =>
        option.setName('utilisateur')
            .setDescription('L\'utilisateur que tu veux warn')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('raison')
            .setDescription('La raison du warn')
            .setRequired(true));

export async function execute(interaction) {
    const warnchannel = interaction.guild.channels.cache.get('1147977872414351380');
    const message = interaction.options.getString('raison');
    const user = interaction.options.getUser('utilisateur');

    if (!warnchannel) {
        return interaction.reply({ content: '❌ Le salon de suggestions est introuvable.', flags : 64});
    }

    await interaction.reply({ content: `✅ Ton warn a été envoyée au modo !`, flags : 64});
    const sentMessage = await warnchannel.send("⚠️ <@"+ interaction.member+"> a warn <@"+user+"> car :\n"+message);
    await sentMessage.react('✅');
}