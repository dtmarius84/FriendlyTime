//idle 5+ minutes => delete

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MongoClient } = require('mongodb');
const path = require('node:path');
require('dotenv').config({path: path.join(__dirname, '.env')});
const url = process.env.DB_PASSWORD;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('x-o')
		.setDescription("start a game of Tic-Tac-Toe"),

async execute(interaction) {
    const author = interaction.user;
    const server = interaction.guild;
    const id_ttt = interaction.id;

    const emojis = {
        O: '1252907410411098114',
        X: '1252907411757334589',
        empty: '1252907431529287691'
    };

    const createButton = (customId, emoji) => new ButtonBuilder()
        .setCustomId(customId)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emoji)

    const components = [];
    const buttonLayout = [
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty']
    ];

    buttonLayout.forEach((row, rowIndex) => {
        const actionRow = new ActionRowBuilder();
        row.forEach((type, colIndex) => {
            const customId = `ttt-${id_ttt}-${rowIndex}${colIndex}`;
            actionRow.addComponents(createButton(customId, emojis[type]));
        });
        components.push(actionRow);
    });

    await interaction.reply({
        content: `waiting for an opponent`,
        components
    });

    try {
        const dbclient = new MongoClient(url);
        await dbclient.connect();
        const db = dbclient.db('kazusa');
        const ttt = db.collection('ttt');
        await ttt.insertOne({
            "turn": 0,
            "opponent": null,
            "serverid": server.id,
            "interactionid": id_ttt,
            "author": author.id
        });

    console.log(`${interaction.user.tag} started a ttt match  ID: ${id_ttt}`);
    } catch (error) {
      console.error('Error:', error);
    }
},
};