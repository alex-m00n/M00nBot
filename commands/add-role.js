import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Ajoute un rôle à un utilisateur')
    .setDefaultMemberPermissions('268435456')
    .addUserOption(option =>
        option.setName('utilisateur')
            .setDescription('Utilisateur à qui ajouter le rôle.')
            .setRequired(true))
    .addRoleOption(option =>
        option.setName('role')
            .setDescription('Le rôle à ajouter.')
            .setRequired(true));

export async function execute(interaction) {
    const membercmd = interaction.options.getMember('utilisateur');
    const rolecmd = interaction.options.getRole('role');

    if (interaction.member.roles.highest.position <= rolecmd.position) {
        return interaction.reply({
            content: '❌ Tu ne peux pas ajouter un rôle plus élevé ou égal au tien !',
            flags : 64
        });
    }

    if (!membercmd) {
        return interaction.reply({
            content: '❌ Je ne peux pas trouver cet utilisateur.',
            flags : 64
        });
    }

    if (!rolecmd) {
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

    if (rolecmd.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
            content: '❌ Je ne peux pas attribuer ce rôle car il est supérieur ou égal à mon rôle le plus élevé.',
            flags : 64
        });
    }

    try {
        await membercmd.roles.add(rolecmd);
        return interaction.reply({
            content: `✅ Le rôle **${rolecmd.name}** a été ajouté à **${membercmd.user.tag}**.`,
            flags : 64
        });
    } catch (error) {
        console.error(error);
        return interaction.reply({
            content: '❌ Une erreur s\'est produite en ajoutant le rôle. Assurez-vous que j\'ai les permissions nécessaires.',
            flags : 64
        });
    }
}