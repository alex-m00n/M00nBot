import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { commandModules } from '../index.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Envoie les commandes du bot');

export async function execute(interaction) {
    const userPermissions = interaction.member.permissions;
    const availableCommands = [];

    for (const commandName in commandModules) {
        const command = commandModules[commandName];
        const commandPermissions = command.data.defaultMemberPermissions;

        if (userPermissions.has(commandPermissions)) {
            availableCommands.push(`**/${commandName}** - ${command.data.description}`);
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('Commandes Disponibles')
        .setDescription(availableCommands.length > 0 ? availableCommands.join('\n\n') : 'Aucune commande disponible.')
        .setColor('#0099ff');
    try {
        await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('Erreur dans la commande help:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Une erreur est survenue lors de l\'exécution de la commande.', ephemeral: true });
        } else {
            await interaction.editReply({ content: '❌ Une erreur est survenue lors de l\'exécution de la commande.', ephemeral: true });
        }
    }
}