import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

// Configuration de la commande
export const data = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un membre du serveur')
    .addUserOption(option =>
        option.setName('membre')
            .setDescription('Le membre à bannir')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('raison')
            .setDescription('La raison du bannissement')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

// Exécution de la commande
export async function execute(interaction) {
    const banchannel = interaction.guild.channels.cache.get('1377215472369664051');
    const target = interaction.options.getUser('membre');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
    const member = interaction.guild.members.cache.get(target.id);

    // Vérification des permissions
    if (!member.bannable) {
        return interaction.reply({
            content: '❌ Je ne peux pas bannir ce membre.',
            flags : 64
        });
    }

    // Création de l'embed de bannissement
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🚫 Bannissement')
        .setDescription(`${target.tag} a été banni du serveur.`)
        .addFields(
            { name: 'Raison', value: reason },
            { name: 'Modérateur', value: interaction.user.tag }
        )
        .setTimestamp();

    try {
        // Bannissement du membre
        await member.ban({ reason: reason });
        
        // Envoi de la confirmation
        await interaction.reply({ embeds: [embed], flags : 64 });
        await banchannel.send({ embeds: [embed] });
        
        // Tentative d'envoi d'un message au membre banni
        try {
            await target.send({
                embeds: [embed.setDescription(`Vous avez été banni de ${interaction.guild.name}`)]
            });
        } catch (error) {
            console.log(`Impossible d'envoyer un message à ${target.tag}`);
        }
    } catch (error) {
        console.error('Erreur lors du bannissement:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors du bannissement.',
            flags : 64
        });
    }
} 