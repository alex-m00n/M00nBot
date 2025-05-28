import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

// Configuration de la commande
export const data = new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulse un membre du serveur')
    .addUserOption(option =>
        option.setName('membre')
            .setDescription('Le membre à expulser')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('raison')
            .setDescription('La raison de l\'expulsion')
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

// Exécution de la commande
export async function execute(interaction) {
    const target = interaction.options.getUser('membre');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
    const member = interaction.guild.members.cache.get(target.id);

    // Vérification des permissions
    if (!member.kickable) {
        return interaction.reply({
            content: '❌ Je ne peux pas expulser ce membre.',
            flags : 64
        });
    }

    // Création de l'embed d'expulsion
    const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('🥾 Expulsion')
        .setDescription(`${target.tag} a été expulsé du serveur.`)
        .addFields(
            { name: 'Raison', value: reason },
            { name: 'Modérateur', value: interaction.user.tag }
        )
        .setTimestamp();

    try {
        // Expulsion du membre
        await member.kick(reason);
        
        // Envoi de la confirmation
        await interaction.reply({ embeds: [embed] });
        
        // Tentative d'envoi d'un message au membre expulsé
        try {
            await target.send({
                embeds: [embed.setDescription(`Vous avez été expulsé de ${interaction.guild.name}`)]
            });
        } catch (error) {
            console.log(`Impossible d'envoyer un message à ${target.tag}`);
        }
    } catch (error) {
        console.error('Erreur lors de l\'expulsion:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de l\'expulsion.',
            flags : 64
        });
    }
} 