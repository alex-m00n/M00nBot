import { SlashCommandBuilder, EmbedBuilder, ContextMenuCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration de la commande
export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes disponibles')
    .addStringOption(option =>
        option.setName('categorie')
            .setDescription('Catégorie de commandes à afficher')
            .setRequired(false)
            .addChoices(
                { name: '🎵 Musique', value: 'musique' },
                { name: '🛠️ Utilitaires', value: 'utilitaires' },
                { name: '🛡️ Modération', value: 'moderation' },
                { name: '👑 Administration', value: 'admin' },
                { name: '🎲 Fun', value: 'fun' },
                { name: '📋 Menu contextuel', value: 'context' }
            )
    );

// Exécution de la commande
export async function execute(interaction) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const commandsPath = path.join(__dirname);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    const categories = {
        fun: ['tic-tac-toe'],
        musique: ['play'],
        utilitaires: ['bug-report', 'doc', 'help', 'info', 'info-serv', 'move', 'ping', 'rules', 'suggest'],
        moderation: ['add-role', 'ban', 'clear', 'clear-all', 'kick', 'remove-role', 'warn'],
        admin: ['protect-serv', 'set-rules', 'setup-tickets'],
        context: ['warn-user', 'user-info', 'move-user']
    };

    const category = interaction.options.getString('categorie');
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📚 Liste des commandes')
        .setDescription('Voici la liste des commandes disponibles :')
        .setFooter({ text: 'M00nBot - Créé par AlexM00n' });

    if (category) {
        const commands = categories[category];
        if (commands) {
            for (const cmd of commands) {
                try {
                    const command = await import(`./${cmd}.js`);
                    if (command.data && command.data.name) {
                        const isContextMenu = command.data.type === 2;
                        if (isContextMenu) {
                            embed.addFields({ 
                                name: command.data.name,
                                value: 'Commande du menu contextuel'
                            });
                        } else {
                            embed.addFields({ 
                                name: `/${command.data.name}`, 
                                value: command.data.description || 'Pas de description disponible' 
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Erreur lors du chargement de la commande ${cmd}:`, error);
                }
            }
        }
    } else {
        for (const [cat, cmds] of Object.entries(categories)) {
            const commandPromises = cmds.map(async (cmd) => {
                try {
                    const command = await import(`./${cmd}.js`);
                    if (command.data && command.data.name) {
                        const isContextMenu = command.data.type === 2;
                        return isContextMenu ? `\`${command.data.name}\`` : `\`/${command.data.name}\``;
                    }
                    return '';
                } catch (error) {
                    console.error(`Erreur lors du chargement de la commande ${cmd}:`, error);
                    return '';
                }
            });
            
            const commandList = (await Promise.all(commandPromises))
                .filter(cmd => cmd !== '')
                .join(', ');
                
            if (commandList) {
                embed.addFields({ 
                    name: `**${cat.charAt(0).toUpperCase() + cat.slice(1)}**`, 
                    value: commandList 
                });
            }
        }
    }

    await interaction.reply({ embeds: [embed], flags: 64 });
}