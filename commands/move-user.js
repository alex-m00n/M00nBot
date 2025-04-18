import { ContextMenuCommandBuilder } from 'discord.js';

export const data = new ContextMenuCommandBuilder()
    .setName('Move l\'utilisateur')
    .setType(2);

export async function execute(interaction) {

    const member = await interaction.guild.members.fetch(interaction.targetId);
    const interactor = interaction.member;

    if (!member || !member.voice.channel) {
        return interaction.reply({ content: "❌ Ce membre n'est pas dans un salon vocal.", flags : 64});
    }

    if (!interactor.voice.channel) {
        return interaction.reply({ content: "❌ Vous devez être dans un salon vocal pour déplacer quelqu'un.", flags : 64});
    }

    try {
        await member.voice.setChannel(interactor.voice.channel);
        interaction.reply({ content: `✅ ${member} a été déplacé dans ${interactor.voice.channel}.`, flags : 64});
    } catch (error) {
        console.error(error);
        interaction.reply({ content: "❌ Une erreur est survenue lors du déplacement.", flags : 64});
    }
}