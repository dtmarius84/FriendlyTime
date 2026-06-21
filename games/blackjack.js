const {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} = require('discord.js');
const { MongoClient } = require('mongodb');
const path = require('node:path');
require('dotenv').config({path: path.join(__dirname, '.env')});

const url = process.env.DB_PASSWORD;
const dbclient = new MongoClient(url);
const db = dbclient.db('kazusa');

async function Blackjack(client, interaction) {
        let acep //player ace
        let aced //dealer ace
        const [type, gameId, buttonCoords] = interaction.customId.split('-');
        const { rhemojis, bhemojis, demojis, cemojis } = require('/Codes/dc_bots/kazusa/bjimg');
        const allEmojis = { ...rhemojis, ...bhemojis, ...demojis, ...cemojis };
    
        const deck = []
        for (const [key, emoji] of Object.entries(allEmojis)) {
            deck.push(`${emoji.id}-${emoji.val}`);
        }

        const aces = ["<:1h2:1309186357876363374>", "<:1s:1309186359306616922>", "<:1d:1309186355934396447>", "<:1c:1309186354197827584>"]; 

        try {
            await dbclient.connect();
            const bk = db.collection('blackjack');
            const bkData = await bk.findOne({ interactionid: gameId })

            if (!bkData) return;

            let cards1 = bkData.dealer;
            let cards2 = bkData.player;
            let total1 = bkData.total1;
            let total2 = bkData.total2;

            if (bkData.turn == 0) {
                acep = 0;
                aced = 0;
            }

            const author = bkData.author;
            const channelid = bkData.channelid;
            const coins = bkData.coins;
            const embedid = bkData.embedid;

            const channel = client.channels.cache.get(channelid) || await client.channels.fetch(channelid);
            const embedmes = await channel.messages.fetch(embedid);

            if (interaction.user.id !== author.id)
                return interaction.reply({
                    content: "you are not the one who initiated this game, to start a game use the '/blackjack' command.",
                    ephemeral: true
                });

            if (buttonCoords == 0) { //player hit
                const hand = deck[Math.floor(Math.random() * deck.length)]; 
                const [a, b] = hand.split('-');
                total2 += parseInt(b);
                cards2 += a;
                const check = aces.some(item => cards2.includes(item));

                if ( aces.includes(a) ) {
                    acep = 0;
                }

                if (total2 > 21 && check && acep == 0) { //ace code
                    acep = 1; 
                    total2 -= 10;
                }

                bk.updateOne({ interactionid: gameId }, {$set: {turn: 1, player: cards2, total2: total2}});

            if (total2 > 21) {

                const embed = new EmbedBuilder()
                .setColor(0xFF00EB)
                .setTitle('Blackjack')
                .setDescription( `# ***YOU LOST!***\n⠀\n**Dealer's cards**\n# ${cards1}\nTotal: *${total1}*\n⠀\n⠀\n**Your cards**\n# ${cards2}\nTotal: *${total2}*\n⠀\n` )
                .setFooter({ text: `Current bet: ${coins} coins` });
                
                updatedComponents = interaction.message.components.map((actionRow) => {
                    return new ActionRowBuilder().addComponents(
                        actionRow.components.map((btn) => {
                            return ButtonBuilder.from(btn)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true);     
                        })
                    );
                }); 

                await bk.deleteOne({ interactionid: gameId })
                .then(console.log(`bk: dealer win ${total1} ${total2} ${coins}, game deleted:`, gameId))
                .catch((error) => console.error(error));

                embedmes.edit(({ 
                    embeds: [embed],
                    components: updatedComponents
                }))

                return interaction.reply({
                    content: `You lost ${coins} coins!`,
                    ephemeral: true
                })
            }
            }

            if (buttonCoords == 1) { //stand
                cards1 = cards1.replace('<:zback1:1309186467007828082>', '');
                while (total1 < 17) { //dealer hit
                    const hand = deck[Math.floor(Math.random() * deck.length)];
                    const [a, b] = hand.split('-');
                    total1 += parseInt(b);
                    cards1 += a;
                    const check = aces.some(item => cards2.includes(item));

                    if (aces.includes(a)) {
                        aced = 0;
                    }
    
                    if (total2 > 21 && check && aced == 0) { //ace code
                        aced = 1;
                        total1 -= 10;
                    }

                    bk.updateOne({ interactionid: gameId }, {$set: {dealer: cards1, total1: total1}});
                }

            if (total1 > 21) {
                const embed = new EmbedBuilder()
                .setColor(0xFF00EB)
                .setTitle('Blackjack')
                .setDescription( `# ***YOU WON!***\n⠀\n**DEALER's cards**\n# ${cards1}\nTotal: *${total1}*\n⠀\n⠀\n**YOUR cards**\n# ${cards2}\nTotal: *${total2}*\n⠀\n` )
                .setFooter({ text: `Current bet: ${coins} coins` });
            
                updatedComponents = interaction.message.components.map((actionRow) => {
                    return new ActionRowBuilder().addComponents(
                        actionRow.components.map((btn) => {
                            return ButtonBuilder.from(btn)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true);     
                        })
                    );
                }); 

                await bk.deleteOne({ interactionid: gameId })
                .then(console.log(`bk: player win ${total1} ${total2} ${coins}, game deleted: `, gameId))
                .catch((error) => console.error(error));

                embedmes.edit(({ 
                    embeds: [embed],
                    components: updatedComponents
                }))

                return interaction.reply({
                    content: `You won ${coins} coins!`,
                    ephemeral: true
                })
            }
            else {
                if (total1 > total2) {
                    const embed = new EmbedBuilder()
                    .setColor(0xFF00EB)
                    .setTitle('Blackjack')
                    .setDescription( `# ***YOU LOST!***\n⠀\n**DEALER's cards**\n# ${cards1}\nTotal: *${total1}*\n⠀\n⠀\n**YOUR cards**\n# ${cards2}\nTotal: *${total2}*\n⠀\n` )
                    .setFooter({ text: `Current bet: ${coins} coins`,  });
                        
                    updatedComponents = interaction.message.components.map((actionRow) => {
                        return new ActionRowBuilder().addComponents(
                            actionRow.components.map((btn) => {
                                return ButtonBuilder.from(btn)
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true);     
                            })
                        );
                    }); 

                    await bk.deleteOne({ interactionid: gameId })
                    .then(console.log(`bk: dealer win ${total1} ${total2} ${coins}, game deleted: `, gameId))
                    .catch((error) => console.error(error));
    
                    embedmes.edit(({ 
                        embeds: [embed],
                        components: updatedComponents
                    }))
                    
                    return interaction.reply({
                        content: `You lost ${coins} coins!`,
                        ephemeral: true
                    })
                }
                else {
                    if (total2 > total1) {
                        const embed = new EmbedBuilder()
                        .setColor(0xFF00EB)
                        .setTitle('Blackjack')
                        .setDescription( `# ***YOU WON!***\n⠀\n**DEALER's cards**\n# ${cards1}\nTotal: *${total1}*\n⠀\n⠀\n**YOUR cards**\n# ${cards2}\nTotal: *${total2}*\n⠀\n` )
                        .setFooter({ text: `Current bet: ${coins} coins`,  });
                            
                        updatedComponents = interaction.message.components.map((actionRow) => {
                            return new ActionRowBuilder().addComponents(
                                actionRow.components.map((btn) => {
                                    return ButtonBuilder.from(btn)
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true);     
                                })
                            );
                        }); 
    
                        await bk.deleteOne({ interactionid: gameId })
                        .then(console.log(`bk: player win ${total1} ${total2} ${coins}, game deleted: `, gameId))
                        .catch((error) => console.error(error));
        
                        embedmes.edit(({ 
                            embeds: [embed],
                            components: updatedComponents
                        }))
                        
                        return interaction.reply({
                            content: `You won ${coins} coins!`,
                            ephemeral: true
                        })
                    }
                    else 
                        if (total1 == total2) {
                            const embed = new EmbedBuilder()
                            .setColor(0xFF00EB)
                            .setTitle('Blackjack')
                            .setDescription( `# ***IT'S A TIE!***\n⠀\n**DEALER's cards**\n# ${cards1}\nTotal: *${total1}*\n⠀\n⠀\n**YOUR cards**\n# ${cards2}\nTotal: *${total2}*\n⠀\n` )
                            .setFooter({ text: `Current bet: ${coins} coins` });
                            
                            updatedComponents = interaction.message.components.map((actionRow) => {
                                return new ActionRowBuilder().addComponents(
                                    actionRow.components.map((btn) => {
                                        return ButtonBuilder.from(btn)
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true);     
                                    })
                                );
                            }); 
        
                            await bk.deleteOne({ interactionid: gameId })
                            .then(console.log(`game deleted: bk: tie ${total1} ${total2} ${coins}  ID:`, gameId))
                            .catch((error) => console.error(error));
            
                            embedmes.edit(({ 
                                embeds: [embed],
                                components: updatedComponents
                            }))

                            return interaction.reply({
                                content: `Your sum remains the same.`,
                                ephemeral: true
                            })
                        }
                }
            }
        }

        try {
            await interaction.deferUpdate();

            const embed = new EmbedBuilder()
            .setColor(0xFF00EB)
            .setTitle('Blackjack')
            .setDescription( `\n**DEALER's cards**\n# ${cards1}\nTotal: *${total1}*\n⠀\n⠀\n**YOUR cards**\n# ${cards2}\nTotal: *${total2}*` )
            .addFields(
                { name: '\u200B', value: '\u200B'},
                { name: ' ', value: 'Press <:regional_indicator_empty:1252907431529287691> to get a card' },
                { name: ' ', value: 'Press ⬜ to stand'}
            )
            .setFooter({ text: `Current bet: ${coins} coins` });
                
            await embedmes.edit(({ embeds: [embed] }))
            console.log(`bk: ${total1} ${total2} ${coins} ID:${gameId}`)

            } catch (error) {
            console.error(error);
            }

        } catch (error) {
            console.error(error);
        }
    }

module.exports = {Blackjack}
