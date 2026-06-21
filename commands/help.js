const { SlashCommandBuilder, EmbedBuilder, italic } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription("sends a list with the bot's commands"),

async execute(interaction) {
    const bot = interaction.client.user;
    const embed = new EmbedBuilder()
        .setColor(0xFF00EB)
        .setTitle('kazusa-san')
        .setThumbnail(bot.avatarURL())
        .setDescription( italic('a fun anime bot with games') )
        .addFields(
            { name: ' ', value: ' ' },
            { name: 'Game Commands', value: `**/x-o** - start a tic-tac-toe game\n
			**/blackjack** - start a blackjack game\n`},
            { name: ' ', value: ' ' },
            //{ name: 'Admin Commands', value: `**/ping** - spam an user with pings (extremely funny) \n**/redirect** - this commands will redirect the bot to a certain channel, whenever a message is sent in said channel it will reply \n**/unredirect** - wipes up the /redirect channel`},
        )
        .setFooter({ text: `thank you for using this bot :)` });

	return interaction.reply({ embeds: [embed] });
	},
};
