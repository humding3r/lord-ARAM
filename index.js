const { token } = require("./config.json");
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require('axios');
const cheerio = require('cheerio');

const client = new Client({ 
	intents: [
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	]
});

client.on('ready', () => {
	console.log('LordARAM is online!');
});

client.once(Events.ClientReady, async c => {
	console.log(`Logged in as ${c.user.tag}`);


	const aram = new SlashCommandBuilder()
		.setName('aram')
		.setDescription('Get ARAM stats for a champion')
		.addStringOption(option =>
			option.setName('champion')
				.setDescription('The name of the champion')
				.setRequired(true));

	const aramCommand = aram.toJSON();

	client.application.commands.create(aramCommand);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand())
		return;

	if (interaction.commandName === "aram") {
		const champion = interaction.options.getString("champion");

		try {
			const aramData = await getAramStats(champion);
			await interaction.reply(aramData);
		} catch (error) {
			console.error(error);
			await interaction.reply("Error fetching ARAM data.");
		}
	}
});

async function getAramStats(champion) {
	const url = `https://u.gg/lol/champions/aram/${champion.toLowerCase()}-aram`;

	try {
		const { data } = await axios.get(url);
		const $ = cheerio.load(data);

		const winRate = $('div.win-rate > div.value').text()
		const pickRate = $('div.pick-rate > div.value').text()

		console.log(`Champion requested: ${champion}`);
		console.log(`Win Rate: ${winRate}`);
		console.log(`Pick Rate: ${pickRate}`);

		return `ARAM Stats for ${champion}:\nWin Rate: ${winRate}\nPick Rate: ${pickRate}`
	} catch (error) {
		console.error(error);
		throw new Error("Failed to fetch ARAM stats");
	}
}

client.login(token);
