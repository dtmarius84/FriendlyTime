const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({path: path.join(__dirname, '.env')});
const { Client, Collection, Events, GatewayIntentBits} = require('discord.js');

const { Blackjack } = require('./games/blackjack');
const { TicTacToe } = require('./games/x-o');

const token = process.env.TOKEN;

const client = new Client
        ({ intents:
          [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.GuildPresences,
					
          ]
         });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
	console.log('FT is online');
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;

    const buttonId = interaction.customId;

    if (buttonId.startsWith('bk-')) {
        await Blackjack(client, interaction); 

    } else if (buttonId.startsWith('ttt-')) {
        await TicTacToe(client, interaction); 
    }
});

client.login(token);
