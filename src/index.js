const { token } = require("../config.json");
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require('axios');
const cheerio = require('cheerio');

const spells = require('../data/spells.json');

const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildEmojisAndStickers,
	]
});

client.on('ready', () => {
	console.log('LordARAM is online!');
	console.log(spells);
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
			const aramData = await getAramStats(champion.charAt(0).toUpperCase() + champion.substring(1).toLowerCase());
			await interaction.reply({ embeds: [aramData] });
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

		const winRate = $('div.win-rate > div.value').text();
		const pickRate = $('div.pick-rate > div.value').text();
		const tier = $('div.tier').text();
		const portrait = $('img.champion-image').attr('src');
		const spellOne = $('div.summoner-spells > div.flex > img').eq(0).attr('alt').replace('Summoner Spell', '').trim();
		const spellOneIcon = client.emojis.cache.get(spells[spellOne]);
		const spellTwo = $('div.summoner-spells > div.flex > img').eq(1).attr('alt').replace('Summoner Spell', '').trim();
		const spellTwoIcon = client.emojis.cache.get(spells[spellTwo]);

		let skillOrder = [ '', '', '', '' ];

		for (let i = 0; i < 4; ++i) {
			$('div.skill-order').eq(i).children().each(function (j, elem) {
				if ($(this).hasClass('skill-up'))
					skillOrder[i] += '🔲';
				else if ($(this).hasClass('no-skill-up'))
					skillOrder[i] += '⬛';
			});
		}

		console.log(skillOrder);

		const aramStats = new EmbedBuilder()
			.setColor(0x3273FA)
			.setTitle(`${champion} ARAM Statistics`)
			.setURL(url)
			.setAuthor({
				name: 'LordARAM',
				iconURL: 'https://ia800305.us.archive.org/31/items/discordprofilepictures/discordgreen.png',
				url: 'https://github.com/humding3r/lord-ARAM',
			})
			.setDescription(`\*\*Highest Win Rate\*\* info for \*\*${champion}\*\*`)
			.setThumbnail(portrait)
			.addFields(
				{ name: '\*\*Win Rate\*\*', value: winRate, inline: true },
				{ name: '\*\*Pick Rate\*\*', value: pickRate, inline: true },
				{ name: '\*\*Tier\*\*', value: tier, inline: true },
				{ name: '\*\*Skill Order\*\*', 
					value: `🇶\t${skillOrder[0]}
						🇼\t${skillOrder[1]}
						🇪\t${skillOrder[2]}
						🇷\t${skillOrder[3]}` },
				{ name: '\*\*Spells\*\*',
					value: `${spellOneIcon}\t\*${spellOne}\*
						${spellTwoIcon}\t\*${spellTwo}\*` },
			);

		return aramStats;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to fetch ARAM stats");
	}
}

client.login(token);
