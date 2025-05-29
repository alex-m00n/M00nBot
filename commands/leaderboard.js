import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
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
                    .setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator))
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
                    .setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator));

function loadLeaderboard() {
    const filePath = path.join(__dirname, '..', 'data', 'leaderboard.json');
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: {} };
    }
}

function saveLeaderboard(leaderboard) {
    const filePath = path.join(__dirname, '..', 'data', 'leaderboard.json');
    fs.writeFileSync(filePath, JSON.stringify(leaderboard, null, 4));
}

async function updateTopRoles(guild, leaderboard) {
    const sortedUsers = Object.entries(leaderboard.users)
        .sort(([, a], [, b]) => b.points - a.points)
        .slice(0, 3);

    // Récupérer les rôles existants
    const firstPlaceRole = guild.roles.cache.find(role => role.id === '1348008963890876446');
    const secondPlaceRole = guild.roles.cache.find(role => role.id === '1348009252794404934');
    const thirdPlaceRole = guild.roles.cache.find(role => role.id === '1348009535989612565');

    if (!firstPlaceRole || !secondPlaceRole || !thirdPlaceRole) {
        console.error('❌ Un ou plusieurs rôles de classement sont manquants');
        return;
    }

    // Retirer les rôles de tous les membres
    for (const role of [firstPlaceRole, secondPlaceRole, thirdPlaceRole]) {
        for (const member of role.members.values()) {
            await member.roles.remove(role);
        }
    }

    // Attribuer les nouveaux rôles
    for (let i = 0; i < sortedUsers.length; i++) {
        const [userId] = sortedUsers[i];
        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) {
            if (i === 0) await member.roles.add(firstPlaceRole);
            else if (i === 1) await member.roles.add(secondPlaceRole);
            else if (i === 2) await member.roles.add(thirdPlaceRole);
        }
    }
}

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const leaderboard = loadLeaderboard();

    switch (subcommand) {
        case 'view':
            const sortedUsers = Object.entries(leaderboard.users)
                .sort(([, a], [, b]) => b.points - a.points)
                .slice(0, 10);

            const embed = new EmbedBuilder()
                .setTitle('🏆 Classement du serveur')
                .setColor('#FFD700')
                .setDescription(sortedUsers.length === 0 ? 'Aucun membre n\'a encore de points.' : '');

            for (let i = 0; i < sortedUsers.length; i++) {
                const [userId, userData] = sortedUsers[i];
                const user = await interaction.client.users.fetch(userId);
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                embed.addFields({
                    name: `${medal} ${user.tag}`,
                    value: `${userData.points} points`,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed] });
            break;

        case 'add':
            const memberToAdd = interaction.options.getUser('membre');
            const pointsToAdd = interaction.options.getInteger('points');

            if (!leaderboard.users[memberToAdd.id]) {
                leaderboard.users[memberToAdd.id] = { points: 0 };
            }

            leaderboard.users[memberToAdd.id].points += pointsToAdd;
            saveLeaderboard(leaderboard);
            await updateTopRoles(interaction.guild, leaderboard);

            await interaction.reply({
                content: `✅ ${pointsToAdd} points ont été ajoutés à ${memberToAdd.tag}. Nouveau total : ${leaderboard.users[memberToAdd.id].points} points.`,
                flags: 64
            });
            break;

        case 'remove':
            const memberToRemove = interaction.options.getUser('membre');
            const pointsToRemove = interaction.options.getInteger('points');

            if (!leaderboard.users[memberToRemove.id]) {
                leaderboard.users[memberToRemove.id] = { points: 0 };
            }

            leaderboard.users[memberToRemove.id].points = Math.max(0, leaderboard.users[memberToRemove.id].points - pointsToRemove);
            saveLeaderboard(leaderboard);
            await updateTopRoles(interaction.guild, leaderboard);

            await interaction.reply({
                content: `✅ ${pointsToRemove} points ont été retirés à ${memberToRemove.tag}. Nouveau total : ${leaderboard.users[memberToRemove.id].points} points.`,
                flags: 64
            });
            break;
    }
} 