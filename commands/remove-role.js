import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('remove-role')
    .setDescription('Enlève un rôle à un utilisateur')
    .setDefaultMemberPermissions('268435456')
    .addUserOption(option =>
        option.setName('utilisateur')
            .setDescription('Utilisateur à qui enlever le rôle.')
            .setRequired(true))
    .addRoleOption(option =>
        option.setName('role')
            .setDescription('Le rôle à enlever.')
            .setRequired(true));

export async function execute(interaction) {
    const member = interaction.options.getMember('utilisateur');
    const role = interaction.options.getRole('role');

    if (!member) {
        return interaction.reply({
            content: '❌ Je ne peux pas trouver cet utilisateur.',
            flags : 64
        });
    }

    if (!role) {
        return interaction.reply({
            content: '❌ Je ne peux pas trouver ce rôle.',
            flags : 64
        });
    }

    if (!interaction.guild.members.me) {
        return interaction.reply({
            content: '❌ Impossible de vérifier les permissions du bot.',
            flags : 64
        });
    }

    if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
        return interaction.reply({
            content: '❌ Je n\'ai pas la permission de gérer les rôles.',
            flags : 64
        });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
            content: '❌ Je ne peux pas enlever ce rôle car il est supérieur ou égal à mon rôle le plus élevé.',
            flags : 64
        });
    }

    try {
        await member.roles.remove(role);
        return interaction.reply({
            content: `✅ Le rôle **${role.name}** a été enlevé à **${member.user.tag}**.`,
            flags : 64
        });
    } catch (error) {
        console.error(error);
        return interaction.reply({
            content: '❌ Une erreur s\'est produite en enlevant le rôle. Assurez-vous que j\'ai les permissions nécessaires.',
            flags : 64
        });
    }
}