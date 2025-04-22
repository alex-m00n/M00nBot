import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('protect-serv')
    .setDescription('Setup le système de protection du serveur')
    .setDefaultMemberPermissions('8');

export async function execute(interaction) {
    const embed = new EmbedBuilder()
        .setAuthor({
            name: "MØØN Bot",
            url: "https://m00n-bot.vercel.app",
            iconURL: interaction.client.user.avatarURL(),
        })
        .setTitle("Règles du serveur __" + interaction.guild.name + "__")
        .addFields(
            { name: "I. Traiter tout le monde avec respect", value: "Aucun harcèlement, chasse aux sorcières, sexisme, racisme ou discours de haine ne sera toléré." },
            { name: "II. Pas de contenu obscène ou soumis à une limite d'âge", value: "Qu'il s'agisse de texte, d'images ou de liens mettant en scène de la nudité, du sexe, de l'hyperviolence ou tout autre contenu explicite perturbant." },
            { name: "III. Si tu remarques quelque chose de contraire aux règles ou qui te met dans un sentiment d'insécurité", value: "Informes en les modérateurs." },
            { name: "IV. Pas de spam ni d'autopromotion", value: "(invitations de serveurs, publicités, etc.), sans l'autorisation d'un modérateur du serveur, y compris via les MP envoyés aux autres membres." },
            { name: "V. Ne répandez pas de fakenews", value: "Ou autres forme de propagande." },
            { name: "Si ces règles ne sont pas respecter vous serez sanctionné !", value: "L'équipe de modération" },
            { name: "Cliquer sur le bouton vert pour accéder au serveur !", value: "Et surtout profitez de celui-ci !" },
        )
        .setThumbnail(interaction.guild.iconURL());

    const btn = new ButtonBuilder()
        .setCustomId("verifie")
        .setLabel("Accepter le réglement du serveur")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(btn);

    interaction.reply({ embeds: [embed], components: [row] });
}