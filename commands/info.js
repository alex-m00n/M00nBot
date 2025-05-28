import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Envoie les infos d\'un utilisateur')
    .addUserOption(option =>
        option.setName('utilisateur')
            .setDescription('L\'utilisateur dont tu veux les infos')
            .setRequired(true))


export async function execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
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