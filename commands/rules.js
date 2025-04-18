import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Affiche les règles du serveur.');

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
            { name: "III. Si tu remarques quelque chose de contraire aux règles ou qui te met dans un sentiment d'insécurité", value: "Informe-en les modérateurs." },
            { name: "IV. Pas de spam ni d'autopromotion", value: "(invitations de serveurs, publicités, etc.), sans l'autorisation d'un modérateur du serveur, y compris via les MP envoyés aux autres membres." },
            { name: "V. Ne répandez pas de fakenews", value: "Ou autres forme de propagande." },
            { name: "Si ces règles ne sont pas respecter vous serez sanctionné !", value: "L'équipe de modération" },
        )
        .setThumbnail(interaction.guild.iconURL());

    interaction.reply({ embeds: [embed], flags: 64});
}