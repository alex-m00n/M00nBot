import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// Configuration de la commande
export const data = new SlashCommandBuilder()
    .setName('info-serv')
    .setDescription('Affiche les informations sur le serveur');

// Exécution de la commande
export async function execute(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();

    // Création de l'embed d'informations
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Informations sur ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
            { name: '👑 Propriétaire', value: owner.user.tag, inline: true },
            { name: '👥 Membres', value: `${guild.memberCount}`, inline: true },
            { name: '🤖 Bots', value: `${guild.members.cache.filter(m => m.user.bot).size}`, inline: true },
            { name: '📝 Salons', value: `${guild.channels.cache.size}`, inline: true },
            { name: '🎭 Rôles', value: `${guild.roles.cache.size}`, inline: true },
            { name: '📅 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '🆔 ID du serveur', value: guild.id, inline: true }
        )
        .setFooter({ text: `Demandé par ${interaction.user.tag}` })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
}