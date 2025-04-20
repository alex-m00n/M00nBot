import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('setup-tickets')
    .setDescription('Setup le système de tickets')
    .setDefaultMemberPermissions('8');

export async function execute(interaction) {
    const embedsetuptickets = new EmbedBuilder()
        .setAuthor({
            name: "MØØN Bot",
            url: "https://m00n-bot.vercel.app",
            iconURL: interaction.client.user.avatarURL(),
        })
        .setTitle('Le système de ticket du serveur __' + interaction.guild.name + '__ !')
        .addFields(
            { name: 'Voici le système de tickets du serveur __' + interaction.guild.name + '__ !', value: 'Ici tu peux poser des questions à l\'équipe de modération. Ne leur envoie pas des DM. Passe par les tickets s\'il te manques des informations ou que tu veux parler de problèmes que tu rencontres sur le serveur.' },
        )
        .setThumbnail(interaction.guild.iconURL());

    const btnsetuptickets = new ButtonBuilder()
        .setCustomId('createtickets')
        .setLabel('Créer un ticket')
        .setEmoji('🎟️')
        .setStyle(ButtonStyle.Primary);

    const rowbtnsetuptickets = new ActionRowBuilder().addComponents(btnsetuptickets);

    interaction.reply({ embeds: [embedsetuptickets], components: [rowbtnsetuptickets] });
}