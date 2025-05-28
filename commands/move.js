import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

// Configuration de la commande
export const data = new SlashCommandBuilder()
    .setName('move')
    .setDescription('Déplace un membre dans un autre salon vocal')
    .addUserOption(option =>
        option.setName('membre')
            .setDescription('Le membre à déplacer')
            .setRequired(true))
    .addChannelOption(option =>
        option.setName('salon')
            .setDescription('Le salon vocal de destination')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers);

// Exécution de la commande
export async function execute(interaction) {
    const target = interaction.options.getUser('membre');
    const channel = interaction.options.getChannel('salon');
    const member = interaction.guild.members.cache.get(target.id);

    // Vérifications
    if (!member.voice.channel) {
        return interaction.reply({
            content: '❌ Ce membre n\'est pas dans un salon vocal.',
            flags: 64
        });
    }

    if (channel.type !== 2) {
        return interaction.reply({
            content: '❌ Le salon spécifié n\'est pas un salon vocal.',
            flags: 64
        });
    }

    try {
        // Déplacement du membre
        await member.voice.setChannel(channel);
        await interaction.reply({
            content: `✅ ${target.tag} a été déplacé dans ${channel.name}.`,
            flags: 64
        });
    } catch (error) {
        console.error('Erreur lors du déplacement:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors du déplacement.',
            flags: 64
        });
    }
}