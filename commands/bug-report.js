import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('bug-report')
    .setDescription('Report un bug.')
    .addStringOption(option =>
        option.setName('bug')
            .setDescription('Le bug')
            .setRequired(true));

export async function execute(interaction) {
    const bugchannel = interaction.guild.channels.cache.get('1147977606306730064');
    const message = interaction.options.getString('bug');
    const member = interaction.member;

    if (!bugchannel) {
        return interaction.reply({ content: '❌ Le salon de suggestions est introuvable.', flags : 64});
    }

    await interaction.reply({ content: `✅ Ton bug a été report !`, flags : 64});
    const sentMessage = await bugchannel.send(`📢 **Report bug de <@${member.id}> :**\n${message}\n\nIl faut le fix !\nRépondez lui !`);
    await sentMessage.react('✅');
}