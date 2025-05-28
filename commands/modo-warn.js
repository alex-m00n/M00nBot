import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

// Configuration de la commande
export const data = new SlashCommandBuilder()
    .setName('warn-user')
    .setDescription('Avertit un membre du serveur')
    .addUserOption(option =>
        option.setName('membre')
            .setDescription('Le membre à avertir')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('raison')
            .setDescription('La raison de l\'avertissement')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

// Exécution de la commande
export async function execute(interaction) {
    const warnchannel = interaction.guild.channels.cache.get('1147977872414351380');
    const target = interaction.options.getUser('membre');
    const reason = interaction.options.getString('raison');
    const member = interaction.guild.members.cache.get(target.id);

    // Création de l'embed d'avertissement
    const embed = new EmbedBuilder()
        .setColor('#ffff00')
        .setTitle('⚠️ Avertissement')
        .setDescription(`${target.tag} a reçu un avertissement.`)
        .addFields(
            { name: 'Raison', value: reason },
            { name: 'Modérateur', value: interaction.user.tag }
        )
        .setTimestamp();

    try {
        // Envoi de la confirmation
        await interaction.reply({ content: "✅ Votre warn a été éffectuer :", embeds: [embed], flags: 64 });
        await warnchannel.send({ embeds: [embed] });

        // Tentative d'envoi d'un message au membre averti
        try {
            await target.send({
                embeds: [embed.setDescription(`Vous avez reçu un avertissement sur ${interaction.guild.name}\nCar : ${reason}`)]
            });
        } catch (error) {
            console.log(`Impossible d'envoyer un message à ${target.tag}`);
        }
    } catch (error) {
        console.error('Erreur lors de l\'avertissement:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de l\'avertissement.',
            flags: 64
        });
    }
}