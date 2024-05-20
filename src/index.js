const { token } = require("../config.json");
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require('axios');
const cheerio = require('cheerio');

const spells = require('../data/spells.json');
const runes = require('../data/runes.json');
const ranks = require('../data/ranks.json');
const builds = require('../data/builds.json');

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
			const aramData = await getAramStats(champion.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()));
			await interaction.reply({ embeds: [aramData] });
		} catch (error) {
			console.error(error);
			await interaction.reply("Error fetching ARAM data.");
		}
	}
});

async function getAramStats(champion) {
	const name = champion.replaceAll(' ', '').split('&')[0].toLowerCase();
	const url = `https://u.gg/lol/champions/aram/${name}-aram`;
	const buildName = builds.hasOwnProperty(name) ? builds[name] : name;
	const build = `https://www.aram.build/${buildName}/`;

	try {
		const { data } = await axios.get(url);
		const $ = cheerio.load(data);
		const buildSite = await axios.get(build);
		const buildData = await buildSite.data;
		const B = cheerio.load(buildData);

		const championName = $('span.champion-name').text();
		const winRate = $('div.win-rate > div.value').text();
		const pickRate = $('div.pick-rate > div.value').text();
		const tier = $('div.tier').text();
		const rank = client.emojis.cache.get(ranks[tier]);
		const matches = $('div.matches > div.value').text();
		const portrait = $('img.champion-image').attr('src');

		const spellOne = $('div.summoner-spells > div.flex > img').eq(1).attr('alt').replace('Summoner Spell', '').trim().toLowerCase();
		const spellOneIcon = client.emojis.cache.get(spells[spellOne]);
		const spellTwo = $('div.summoner-spells > div.flex > img').eq(0).attr('alt').replace('Summoner Spell', '').trim().toLowerCase();
		const spellTwoIcon = client.emojis.cache.get(spells[spellTwo]);

		const keystone = $('div.keystone.perk-active > img').attr('alt').replace('The Keystone', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase();
		const keystoneIcon = client.emojis.cache.get(runes[keystone]);

		const secondary = $('div.perk-style-title').eq(1).text().trim().replaceAll(' ', '_').toLowerCase();
		const secondaryIcon = client.emojis.cache.get(runes[secondary]);

		const rune1 = $('div.perk-active > img').eq(1).attr('alt').replace('The Rune', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase();
		const rune2 = $('div.perk-active > img').eq(2).attr('alt').replace('The Rune', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase();
		const rune3 = $('div.perk-active > img').eq(3).attr('alt').replace('The Rune', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase();
		const rune4 = $('div.perk-active > img').eq(4).attr('alt').replace('The Rune', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase();
		const rune5 = $('div.perk-active > img').eq(5).attr('alt').replace('The Rune', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase();

		const runeIcons = [
			client.emojis.cache.get(runes[rune1]),
			client.emojis.cache.get(runes[rune2]),
			client.emojis.cache.get(runes[rune3]),
			client.emojis.cache.get(runes[rune4]),
			client.emojis.cache.get(runes[rune5]),
		];

		let starters = '';

		B('div.w-full:nth-child(5) > div:nth-child(2)').children().each(function (i, elem) {
			starters += `\* ${B(this).children().attr('alt')}\n`;
		});

		let core = '';

		B('div.w-full:nth-child(6) > div:nth-child(2)').children('img').each(function (i, elem) {
			core += `\> ${B(this).attr('alt')}\n`;
		});

		let late = '';

		B('div.w-full:nth-child(7) > div:nth-child(2)').children().each(function (i, elem) {
			late += `\> ${B(this).children().attr('alt')}\n`;
		});

		let skillOrder = [ '', '', '', '' ];

		for (let i = 0; i < 4; ++i) {
			$('div.skill-order').eq(i).children().each(function (j, elem) {
				if ($(this).hasClass('skill-up'))
					skillOrder[i] += '🔲';
				else if ($(this).hasClass('no-skill-up'))
					skillOrder[i] += '⬛';
			});
		}

		const aramStats = new EmbedBuilder()
			.setColor(0x3273FA)
			.setTitle(`${championName} ARAM Statistics`)
			.setURL(url)
			.setAuthor({
				name: 'LordARAM',
				iconURL: 'https://ia800305.us.archive.org/31/items/discordprofilepictures/discordgreen.png',
				url: 'https://github.com/humding3r/lord-ARAM',
			})
			.setDescription(`\*\*Highest Win Rate\*\* info for \*\*${championName}\*\*`)
			.setThumbnail(portrait)
			.addFields(
				{ name: '\*\*Win Rate\*\*', value: winRate, inline: true },
				{ name: '\*\*Pick Rate\*\*', value: pickRate, inline: true },
				{ name: '\*\*Tier\*\*', value: `${rank}`, inline: true },
				{ name: '\*\*Skill Order\*\*', 
					value: `🇶\t${skillOrder[0]}
						🇼\t${skillOrder[1]}
						🇪\t${skillOrder[2]}
						🇷\t${skillOrder[3]}` },
				{ name: '\*\*Spells\*\*',
					value: `${spellOneIcon}\t\*${spellOne.charAt(0).toUpperCase() + spellOne.slice(1)}\*
						${spellTwoIcon}\t\*${spellTwo.charAt(0).toUpperCase() + spellTwo.slice(1)}\*`,
					inline: true },
				{ name: '\*\*Runes\*\*',
					value: `${keystoneIcon} ${runeIcons[0]} ${runeIcons[1]} ${runeIcons[2]}
						${secondaryIcon} ${runeIcons[3]} ${runeIcons[4]}`,
					inline: true },
				{ name: '\*\*Starter Items\*\*', value: starters, inline: true },
				{ name: '\*\*Core Items\*\*', value: core, inline: true },
				{ name: '\*\*Late Game Items\*\*', value: late, inline: true },
			);

		return aramStats;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to fetch ARAM stats");
	}
}

client.login(token);
