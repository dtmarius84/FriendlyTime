//add fold?

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MongoClient } = require('mongodb');
const path = require('node:path');
require('dotenv').config({path: path.join(__dirname, '.env')});
const uri = process.env.DB_PASSWORD;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blackjack')
		.setDescription("Card game in which the objective is to get closer than the dealer to (but not exceeding) 21")
        .addIntegerOption(option =>option.setName('bet').setDescription('insert the amount of coins you are betting').setRequired(false)),

async execute(interaction) {
    const author = interaction.user;
    const server = interaction.guild;
    const channel = interaction.channel;
    const coins = interaction.options.getInteger('bet');
    const id_bk = interaction.id;

    const emojis = {
        hit: '<:regional_indicator_empty:1252907431529287691>',
        stay: '⬜',
    };

    const { rhemojis, bhemojis, demojis, cemojis } = require('../bjimg');
    const allEmojis = { ...rhemojis, ...bhemojis, ...demojis, ...cemojis };

    const deck = []
    for (const [key, emoji] of Object.entries(allEmojis)) {
        deck.push(`${emoji.id}-${emoji.val}`);
    }

    var total1 = 0;
    var total2 = 0;
    const cards1 = [];
    const cards2 = [];

    const hand1 = deck[Math.floor(Math.random() * deck.length)];
    const [b, c] = hand1.split('-');
    total1 += parseInt(c);
    cards1.push(b);
    cards1.push("<:zback1:1309186467007828082>");

    for (i = 0; i < 2; i++) {
        const hand2 = deck[Math.floor(Math.random() * deck.length)];
        const [a, d] = hand2.split('-');
        total2 += parseInt(d);
        cards2.push(a);
    }

    const value1 = cards1.join("");
    const value2 = cards2.join("");

    const embedmes = new EmbedBuilder()
        .setColor(0xFF00EB)
        .setTitle('Blackjack')
        .setDescription( `⠀\n**DEALER's cards**\n# ${value1}\nTotal: *${total1}*\n⠀\n⠀\n**YOUR cards**\n# ${value2}\nTotal: *${total2}*` )
        .addFields(
            { name: '\u200B', value: '\u200B'},
            { name: ' ', value: 'Press <:regional_indicator_empty:1252907431529287691> to get a card' },
            { name: ' ', value: 'Press ⬜ to stand'}
        )
        .setFooter({ text: `Current bet: ${coins} coins`, iconURL: author.displayAvatarURL() });

    const createButton = (customId, emoji) => new ButtonBuilder()
        .setCustomId(customId)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emoji)

    const components = [];
    const buttonLayout = [
        ['hit', 'stay']
    ];

    buttonLayout.forEach((row, rowIndex) => {
        const actionRow = new ActionRowBuilder();
        row.forEach((type, colIndex) => {
            const customId = `bk-${id_bk}-${rowIndex}${colIndex}`;
            actionRow.addComponents(createButton(customId, emojis[type]));
        });
        components.push(actionRow);
    });

	return interaction.reply({ 
        embeds: [embedmes],
        components,
        fetchReply: true
    })
    .then( async message => {
        try {
            const dbclient = new MongoClient(uri);
            await dbclient.connect();
            const db = dbclient.db('FriendlyTime');
            const bk = db.collection('blackjack');
            await bk.insertOne({
                "turn": 0,
                "serverid": server.id,
                "channelid": channel.id,
                "interactionid": id_bk,
                "dealer": value1,
                "player": value2,
                "total1": total1,
                "total2": total2,
                "author": author,
                "coins": coins,
                "embedid": message.id
            });

        console.log(`${interaction.user.tag} started a blackjack match  ID: ${id_bk}`);
        } catch (error) {
        console.error('Error:', error);
      }
    })
},
};
