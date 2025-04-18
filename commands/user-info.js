import { ContextMenuCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new ContextMenuCommandBuilder()
    .setName('Informations sur l\'utilisateur')
    .setType(2);

export async function execute(interaction) {
    const user = interaction.targetUser;
    const member = await interaction.guild.members.fetch(user.id);

    const embed = new EmbedBuilder()
        .setTitle(`Informations sur ${user.tag}`)
        .addFields(
            { name: 'ID', value: user.id, inline: true },
            { name: 'Rôle principal', value: member.roles.highest.name, inline: true },
            { name: 'Rejoint le serveur', value: member.joinedAt.toDateString(), inline: true },
            { name: 'Créé le compte', value: user.createdAt.toDateString(), inline: true }
        )
        .setColor('#0099ff')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    await interaction.reply({ embeds: [embed], flags: 64 });
}