import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Affiche le classement des membres du serveur')
    .addSubcommand(subcommand =>
        subcommand
            .setName('view')
            .setDescription('Affiche le classement'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Ajoute des points à un membre')
            .addUserOption(option =>
                option.setName('membre')
                    .setDescription('Le membre à qui ajouter des points')
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('points')
                    .setDescription('Nombre de points à ajouter')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Retire des points à un membre')
            .addUserOption(option =>
                option.setName('membre')
                    .setDescription('Le membre à qui retirer des points')
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('points')
                    .setDescription('Nombre de points à retirer')
                    .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

function loadLeaderboard() {
    const filePath = path.join(__dirname, '..', 'data', 'leaderboard.json');
    try {
        if (!fs.existsSync(filePath)) {
            const initialData = { users: {} };
            fs.writeFileSync(filePath, JSON.stringify(initialData, null, 4));
            return initialData;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Erreur lors du chargement du leaderboard:', error);
        return { users: {} };
    }
}

function saveLeaderboard(leaderboard) {
    const filePath = path.join(__dirname, '..', 'data', 'leaderboard.json');
    try {
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(leaderboard, null, 4));
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du leaderboard:', error);
        throw new Error('Impossible de sauvegarder le leaderboard');
    }
}

async function updateTopRoles(guild, leaderboard) {
    try {
        console.log('🔄 Début de la mise à jour des rôles...');
        const sortedUsers = Object.entries(leaderboard.users)
            .sort(([, a], [, b]) => b.points - a.points)
            .slice(0, 3);

        console.log('🏆 Top 3:', sortedUsers.map(([id, data]) => `${id}: ${data.points}`));

        const firstPlaceRole = guild.roles.cache.find(role => role.id === '1348008963890876446');
        const secondPlaceRole = guild.roles.cache.find(role => role.id === '1348009252794404934');
        const thirdPlaceRole = guild.roles.cache.find(role => role.id === '1348009535989612565');

        if (!firstPlaceRole || !secondPlaceRole || !thirdPlaceRole) {
            console.error('❌ Un ou plusieurs rôles de classement sont manquants');
            console.log('Rôles trouvés:', {
                first: firstPlaceRole?.name,
                second: secondPlaceRole?.name,
                third: thirdPlaceRole?.name
            });
            return;
        }

        console.log('✅ Rôles trouvés:', {
            first: firstPlaceRole.name,
            second: secondPlaceRole.name,
            third: thirdPlaceRole.name
        });

        // Retirer les rôles de tous les membres
        for (const role of [firstPlaceRole, secondPlaceRole, thirdPlaceRole]) {
            for (const member of role.members.values()) {
                console.log(`🗑️ Retrait du rôle ${role.name} de ${member.user.tag}`);
                await member.roles.remove(role).catch(error => {
                    console.error(`❌ Erreur lors du retrait du rôle ${role.name} de ${member.user.tag}:`, error);
                });
            }
        }

        // Attribuer les nouveaux rôles
        for (let i = 0; i < sortedUsers.length; i++) {
            const [userId] = sortedUsers[i];
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) {
                const role = i === 0 ? firstPlaceRole : i === 1 ? secondPlaceRole : thirdPlaceRole;
                console.log(`👑 Attribution du rôle ${role.name} à ${member.user.tag}`);
                await member.roles.add(role).catch(error => {
                    console.error(`❌ Erreur lors de l'attribution du rôle ${role.name} à ${member.user.tag}:`, error);
                });
            } else {
                console.log(`⚠️ Membre ${userId} non trouvé dans le serveur`);
            }
        }
        console.log('✅ Mise à jour des rôles terminée');
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des rôles:', error);
    }
}

export { updateTopRoles };

export async function execute(interaction) {
    try {
        if (!interaction.guild) {
            await interaction.reply({
                content: '❌ Cette commande ne peut être utilisée que dans un serveur.',
                ephemeral: true
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand();
        const leaderboard = loadLeaderboard();

        switch (subcommand) {
            case 'view': {
                try {
                    // Vérifier si le leaderboard est vide
                    if (!leaderboard.users || Object.keys(leaderboard.users).length === 0) {
                        const emptyEmbed = new EmbedBuilder()
                            .setTitle('🏆 Classement du serveur')
                            .setColor('#FFD700')
                            .setDescription('Aucun membre n\'a encore de points.')
                            .setTimestamp();
                        
                        await interaction.reply({ embeds: [emptyEmbed] });
                        return;
                    }

                    // Trier les utilisateurs
                    const sortedUsers = Object.entries(leaderboard.users)
                        .sort(([, a], [, b]) => b.points - a.points)
                        .slice(0, 10);

                    // Créer l'embed
                    const embed = new EmbedBuilder()
                        .setTitle('🏆 Classement du serveur')
                        .setColor('#FFD700')
                        .setTimestamp();

                    // Ajouter les utilisateurs un par un
                    let description = '';
                    for (let i = 0; i < sortedUsers.length; i++) {
                        const [userId, userData] = sortedUsers[i];
                        const member = interaction.guild.members.cache.get(userId);
                        
                        if (!member) continue;

                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                        description += `${medal} **${member.displayName}** - ${userData.points.toLocaleString()} points\n`;
                    }

                    // Si aucun membre n'a pu être affiché
                    if (!description) {
                        description = 'Aucun membre n\'a encore de points.';
                    }

                    embed.setDescription(description);
                    await interaction.reply({ embeds: [embed] });
                } catch (viewError) {
                    console.error('Erreur lors de l\'affichage du classement:', viewError);
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors de l\'affichage du classement.',
                        ephemeral: true
                    });
                }
                break;
            }

            case 'add': {
                const memberToAdd = interaction.options.getUser('membre');
                const pointsToAdd = interaction.options.getInteger('points');

                // Vérifications de base
                if (!memberToAdd || pointsToAdd <= 0) {
                    await interaction.reply({
                        content: '❌ Paramètres invalides.',
                        ephemeral: true
                    });
                    return;
                }

                // Vérifier si le membre est dans le serveur
                const member = interaction.guild.members.cache.get(memberToAdd.id);
                if (!member) {
                    await interaction.reply({
                        content: '❌ Membre non trouvé sur le serveur.',
                        ephemeral: true
                    });
                    return;
                }

                // Initialiser les points si nécessaire
                if (!leaderboard.users[memberToAdd.id]) {
                    leaderboard.users[memberToAdd.id] = { points: 0 };
                }

                // Ajouter les points
                leaderboard.users[memberToAdd.id].points += pointsToAdd;

                // Sauvegarder
                saveLeaderboard(leaderboard);

                // Mettre à jour les rôles
                await updateTopRoles(interaction.guild, leaderboard);

                // Répondre
                await interaction.reply({
                    content: `✅ ${pointsToAdd} points ajoutés à ${member.displayName}`,
                    ephemeral: true
                });

                break;
            }

            case 'remove': {
                const memberToRemove = interaction.options.getUser('membre');
                const pointsToRemove = interaction.options.getInteger('points');

                // Vérifications de base
                if (!memberToRemove || pointsToRemove <= 0) {
                    await interaction.reply({
                        content: '❌ Paramètres invalides.',
                        ephemeral: true
                    });
                    return;
                }

                // Vérifier si le membre est dans le serveur
                const member = interaction.guild.members.cache.get(memberToRemove.id);
                if (!member) {
                    await interaction.reply({
                        content: '❌ Membre non trouvé sur le serveur.',
                        ephemeral: true
                    });
                    return;
                }

                // Initialiser les points si nécessaire
                if (!leaderboard.users[memberToRemove.id]) {
                    leaderboard.users[memberToRemove.id] = { points: 0 };
                }

                // Retirer les points (ne pas descendre en dessous de 0)
                const oldPoints = leaderboard.users[memberToRemove.id].points;
                leaderboard.users[memberToRemove.id].points = Math.max(0, oldPoints - pointsToRemove);

                // Sauvegarder
                saveLeaderboard(leaderboard);

                // Mettre à jour les rôles
                await updateTopRoles(interaction.guild, leaderboard);

                // Répondre
                await interaction.reply({
                    content: `✅ ${pointsToRemove} points retirés à ${member.displayName}`,
                    ephemeral: true
                });

                break;
            }
        }
    } catch (error) {
        console.error('Erreur détaillée dans la commande leaderboard:', error);
        try {
            await interaction.reply({
                content: '❌ Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer plus tard.',
                ephemeral: true
            });
        } catch (replyError) {
            console.error('Impossible d\'envoyer le message d\'erreur:', replyError);
        }
    }
} 