import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('tic-tac-toe')
  .setDescription('Jouer au morpion contre le bot');

export async function execute(interaction) {
  try {
    const player = interaction.user;
    const bot = interaction.client.user;

    let board = Array(9).fill(null);
    const playerSymbol = '❌';
    const botSymbol = '⭕';
    let gameEnded = false;

    const getBoardComponents = () => {
      const rows = [];
      for (let row = 0; row < 3; row++) {
        const actionRow = new ActionRowBuilder();
        for (let col = 0; col < 3; col++) {
          const index = row * 3 + col;
          actionRow.addComponents(
            new ButtonBuilder()
              .setCustomId(index.toString())
              .setLabel(board[index] ?? '⬜')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(board[index] !== null)
          );
        }
        rows.push(actionRow);
      }
      return rows;
    };

    const checkWin = (symbol) => {
      const winCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];
      return winCombos.some(combo =>
        combo.every(i => board[i] === symbol)
      );
    };

    const isDraw = () => board.every(cell => cell !== null);

    const botPlay = () => {
      // Vérifier d'abord si le bot peut gagner
      const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
      
      // Vérifier si le bot peut gagner
      for (const index of available) {
        board[index] = botSymbol;
        if (checkWin(botSymbol)) {
          return;
        }
        board[index] = null;
      }

      // Vérifier si le joueur peut gagner et bloquer
      for (const index of available) {
        board[index] = playerSymbol;
        if (checkWin(playerSymbol)) {
          board[index] = botSymbol;
          return;
        }
        board[index] = null;
      }

      // Jouer au centre si disponible
      if (board[4] === null) {
        board[4] = botSymbol;
        return;
      }

      // Jouer aléatoirement
      const choice = available[Math.floor(Math.random() * available.length)];
      board[choice] = botSymbol;
    };

    const disableAllButtons = (components) => {
      return components.map(row => {
        const newRow = new ActionRowBuilder();
        row.components.forEach(button => {
          newRow.addComponents(
            ButtonBuilder.from(button.data)
              .setDisabled(true)
          );
        });
        return newRow;
      });
    };

    await interaction.reply({
      content: `🎮 Tic-Tac-Toe contre le bot !\nC'est à ton tour, ${player}.`,
      components: getBoardComponents()
    });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000
    });

    collector.on('collect', async i => {
      try {
        if (i.user.id !== player.id) {
          await i.reply({
            content: "Ce n'est pas ton jeu.",
            flags : 64
          });
          return;
        }

        const index = parseInt(i.customId);
        if (board[index] !== null) {
          await i.reply({
            content: "Cette case est déjà prise !",
            flags : 64
          });
          return;
        }

        board[index] = playerSymbol;

        if (checkWin(playerSymbol)) {
          gameEnded = true;
          await i.update({
            content: `🎉 ${player} a gagné contre le bot !`,
            components: disableAllButtons(getBoardComponents())
          });
          collector.stop();
          return;
        }

        if (isDraw()) {
          gameEnded = true;
          await i.update({
            content: `🤝 Match nul !`,
            components: disableAllButtons(getBoardComponents())
          });
          collector.stop();
          return;
        }

        botPlay();

        if (checkWin(botSymbol)) {
          gameEnded = true;
          await i.update({
            content: `😢 Le bot a gagné !`,
            components: disableAllButtons(getBoardComponents())
          });
          collector.stop();
          return;
        }

        if (isDraw()) {
          gameEnded = true;
          await i.update({
            content: `🤝 Match nul !`,
            components: disableAllButtons(getBoardComponents())
          });
          collector.stop();
          return;
        }

        await i.update({
          content: `🎮 À toi de jouer, ${player}.`,
          components: getBoardComponents()
        });
      } catch (error) {
        console.error('Erreur lors du traitement du coup:', error);
        await i.reply({
          content: "Une erreur est survenue lors du traitement de ton coup.",
          flags : 64
        });
      }
    });

    collector.on('end', async () => {
      try {
        if (!gameEnded) {
          await interaction.editReply({
            content: '⏱️ Temps écoulé !',
            components: disableAllButtons(getBoardComponents())
          });
        }
      } catch (error) {
        console.error('Erreur lors de la fin du jeu:', error);
      }
    });
  } catch (error) {
    console.error('Erreur dans la commande tic-tac-toe:', error);
    await interaction.reply({
      content: "Une erreur est survenue lors du démarrage du jeu.",
      flags : 64
    });
  }
}
