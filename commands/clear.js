import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprimer des messages.')
    .setDefaultMemberPermissions('8192')
    .addNumberOption(option =>
        option.setName('nombre')
            .setDescription('Le nombre de message')
            .setRequired(true));

export async function execute(interaction) {
    const nb = interaction.options.getNumber('nombre');
    await interaction.channel.bulkDelete(nb);
    interaction.reply({ content: `${nb} message(s) a(ont) été supprimé(s)`, flags : 64 });
}