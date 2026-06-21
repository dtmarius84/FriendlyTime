const {ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const {MongoClient} = require('mongodb');
const path = require('node:path');
require('dotenv').config({path: path.join(__dirname, '.env')});

const url = process.env.DB_PASSWORD;
const dbclient = new MongoClient(url);
const db = dbclient.db('FriendlyTime');

const AUTHOR_EMOJI = '1252907410411098114';   // O
const OPPONENT_EMOJI = '1252907411757334589'; // X

async function TicTacToe(client, interaction) {
    const [type, gameId, buttonCoords] = interaction.customId.split('-');

    const rowIndex = Number(buttonCoords.charAt(0));
    const colIndex = Number(buttonCoords.charAt(1));

    try {
        await dbclient.connect();

        const ttt = db.collection('ttt');
        const tttData = await ttt.findOne({ interactionid: gameId });

        if (!tttData) {
            return interaction.reply({
                content: 'this game no longer exists.',
                ephemeral: true
            });
        }

        const currentPlayer = interaction.user;

        let turn = tttData.turn;
        const author = tttData.author;
        let opponent = tttData.opponent;

        // First non-author player becomes the opponent
        if (currentPlayer.id !== author && !opponent) {
            opponent = currentPlayer.id;

            await ttt.updateOne(
                { interactionid: gameId },
                { $set: { opponent: opponent } }
            );
        }

        // Block unrelated users
        if (
            opponent &&
            currentPlayer.id !== author &&
            currentPlayer.id !== opponent
        ) {
            return interaction.reply({
                content: "you're not part of the game. make a new game using the command '/x-o'",
                ephemeral: true
            });
        }

        // If somehow author clicks before an opponent joins
        if (!opponent) {
            return interaction.reply({
                content: 'waiting for an opponent to join.',
                ephemeral: true
            });
        }

        /*
            Turn meaning:
            turn === 0 -> game just started
            turn === 1 -> opponent's turn
            turn === 2 -> author's turn
        */

        // Check whose turn it is
        if (
            turn !== 0 &&
            (
                (currentPlayer.id === opponent && turn !== 1) ||
                (currentPlayer.id === author && turn !== 2)
            )
        ) {
            return interaction.reply({
                content: 'it is not your turn yet',
                ephemeral: true
            });
        }

        // Build updated board
        let updatedComponents = interaction.message.components.map((row, i) => {
            return new ActionRowBuilder().addComponents(
                row.components.map((btn, j) => {
                    const newButton = ButtonBuilder.from(btn);

                    if (i === rowIndex && j === colIndex) {
                        if (currentPlayer.id === author) {
                            return newButton
                                .setEmoji(AUTHOR_EMOJI)
                                .setDisabled(true);
                        } else {
                            return newButton
                                .setEmoji(OPPONENT_EMOJI)
                                .setDisabled(true);
                        }
                    }

                    return newButton;
                })
            );
        });

        const endmatch = (components) => {
            const array = components.map(row =>
                row.components.map(btn => btn.data.emoji?.id)
            );

            let disabledCount = 0;

            components.forEach(row => {
                row.components.forEach(btn => {
                    if (btn.data.disabled) {
                        disabledCount++;
                    }
                });
            });

            for (let i = 0; i < 3; i++) {
                // Rows
                if (
                    array[i][0] &&
                    array[i][0] === array[i][1] &&
                    array[i][1] === array[i][2]
                ) {
                    if (array[i][0] === OPPONENT_EMOJI) return 1;
                    if (array[i][0] === AUTHOR_EMOJI) return 2;
                }

                // Columns
                if (
                    array[0][i] &&
                    array[0][i] === array[1][i] &&
                    array[1][i] === array[2][i]
                ) {
                    if (array[0][i] === OPPONENT_EMOJI) return 1;
                    if (array[0][i] === AUTHOR_EMOJI) return 2;
                }
            }

            // Main diagonal
            if (
                array[0][0] &&
                array[0][0] === array[1][1] &&
                array[1][1] === array[2][2]
            ) {
                if (array[0][0] === OPPONENT_EMOJI) return 1;
                if (array[0][0] === AUTHOR_EMOJI) return 2;
            }

            // Other diagonal
            if (
                array[0][2] &&
                array[0][2] === array[1][1] &&
                array[1][1] === array[2][0]
            ) {
                if (array[0][2] === OPPONENT_EMOJI) return 1;
                if (array[0][2] === AUTHOR_EMOJI) return 2;
            }

            if (disabledCount === 9) {
                return 3; // tie
            }

            return 0; // game continues
        };

        const disableAllButtons = (components) => {
            return components.map(actionRow => {
                return new ActionRowBuilder().addComponents(
                    actionRow.components.map(btn => {
                        return ButtonBuilder.from(btn).setDisabled(true);
                    })
                );
            });
        };

        const highlightWinnerButtons = (components, winningEmoji) => {
            return components.map(actionRow => {
                return new ActionRowBuilder().addComponents(
                    actionRow.components.map(btn => {
                        const newButton = ButtonBuilder.from(btn).setDisabled(true);

                        if (btn.data.emoji?.id === winningEmoji) {
                            return newButton.setStyle(ButtonStyle.Primary);
                        }

                        return newButton;
                    })
                );
            });
        };

        const winner = endmatch(updatedComponents);

        if (winner === 1) {
            updatedComponents = highlightWinnerButtons(updatedComponents, OPPONENT_EMOJI);

            await interaction.update({
                content: `<@${opponent}> has won!`,
                components: updatedComponents
            });

            await ttt.deleteOne({ interactionid: gameId });
            console.log('ttt game deleted:', gameId);
            return;
        }

        if (winner === 2) {
            updatedComponents = highlightWinnerButtons(updatedComponents, AUTHOR_EMOJI);

            await interaction.update({
                content: `<@${author}> has won!`,
                components: updatedComponents
            });

            await ttt.deleteOne({ interactionid: gameId });
            console.log('ttt game deleted:', gameId);
            return;
        }

        if (winner === 3) {
            updatedComponents = disableAllButtons(updatedComponents);

            await interaction.update({
                content: "it's a tie!",
                components: updatedComponents
            });

            await ttt.deleteOne({ interactionid: gameId });
            console.log('ttt game deleted:', gameId);
            return;
        }

        // Update next turn after a valid move
        let content;

        if (currentPlayer.id === author) {
            turn = 1;
            content = `it is <@${opponent}>'s turn`;
        } else {
            turn = 2;
            content = `it is <@${author}>'s turn`;
        }

        await ttt.updateOne(
            { interactionid: gameId },
            { $set: { turn: turn } }
        );

        await interaction.update({
            content: content,
            components: updatedComponents
        });

    } catch (error) {
        console.error(error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'something went wrong while processing the game.',
                ephemeral: true
            });
        }
    }
}

module.exports = { TicTacToe };
