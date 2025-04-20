import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('move')
    .setDescription('Déplace un utilisateur dans un salon vocal')
    .setDefaultMemberPermissions('2')
    .addUserOption(option =>
        option.setName('utilisateur')
            .setDescription('Utilisateur à déplacer.')
            .setRequired(true))
    .addChannelOption(option =>
        option.setName('vocal')
            .setDescription('Salon vocal dans lequel déplacer l\'utilisateur.')
            .setRequired(true));

export async function execute(interaction) {
    const membercmd = interaction.options.getMember('utilisateur');
    const channelcmd = interaction.options.getChannel('vocal');

    if (!membercmd.voice.channel) {
        return interaction.reply({ content: "❌ Ce membre n'est pas dans un salon vocal.", flags : 64 });
    }

    if (channelcmd.type !== 2) {
        return interaction.reply({ content: "❌ Le salon spécifié n'est pas un salon vocal.", flags : 64 });
    }

    try {
        await membercmd.voice.setChannel(channelcmd);
        interaction.reply({ content: `✅ ${membercmd} a été déplacé dans ${channelcmd}.`, flags : 64 });
    } catch (error) {
        console.error(error);
        interaction.reply({ content: "❌ Une erreur est survenue lors du déplacement.", flags : 64 });
    }
}