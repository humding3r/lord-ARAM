const { token } = require("../config.json");
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require('axios');
const cheerio = require('cheerio');

const spells = require('../data/spells.json');
const runes = require('../data/runes.json');
const ranks = require('../data/ranks.json');
const alts = require('../data/alts.json');

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
    const champName = interaction.options.getString("champion");

    try {
      const aramData = await getAramStats(champName.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()));
      await interaction.reply({ embeds: [aramData] });
    } catch (error) {
      console.error(error);
      await interaction.reply("Error fetching ARAM data.");
    }
  }
});

async function getAramStats(champName) {
  const name = champName.replaceAll(' ', '').split('&')[0].toLowerCase();
  const url = `https://u.gg/lol/champions/aram/${name}-aram`;
  const buildName = alts.hasOwnProperty(name) ? alts[name] : name;
  const build = `https://www.aram.build/${buildName}/`;

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const buildSite = await axios.get(build);
    const buildData = await buildSite.data;
    const B = cheerio.load(buildData);

    const champ = {
      name: $('span.champion-name').text(),
      wr: $('div.win-rate > div.value').text(),
      pr: $('div.pick-rate > div.value').text(),
      tier: $('div.tier').text(),
      pic: $('img.champion-image').attr('src'),
      spells: [
        $('div.summoner-spells > div.flex > img').eq(1).attr('alt').replace('Summoner Spell', '').trim().toLowerCase(),
        $('div.summoner-spells > div.flex > img').eq(0).attr('alt').replace('Summoner Spell', '').trim().toLowerCase(),
      ],
      keystone: $('div.keystone.perk-active > img').attr('alt').replace('The Keystone', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase(),
      secondary: $('div.perk-style-title').eq(1).text().trim().replaceAll(' ', '_').toLowerCase(),
      runes: [
        $('div.perk-active > img').eq(1).attr('alt').replace('The Rune', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase(),
        $('div.perk-active > img').eq(2).attr('alt').replace('The Rune', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase(),
        $('div.perk-active > img').eq(3).attr('alt').replace('The Rune', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase(),
        $('div.perk-active > img').eq(4).attr('alt').replace('The Rune', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase(),
        $('div.perk-active > img').eq(5).attr('alt').replace('The Rune', '').replace(':', '').trim().replaceAll(' ', '_').toLowerCase(),
      ]
    };

    const icons = {
      tier: client.emojis.cache.get(ranks[champ.tier]),
      spells: [
        client.emojis.cache.get(spells[champ.spells[0]]),
        client.emojis.cache.get(spells[champ.spells[1]]),
      ],
      keystone: client.emojis.cache.get(runes[champ.keystone]),
      secondary: client.emojis.cache.get(runes[champ.secondary]),
      runes: [
        client.emojis.cache.get(runes[champ.runes[0]]),
        client.emojis.cache.get(runes[champ.runes[1]]),
        client.emojis.cache.get(runes[champ.runes[2]]),
        client.emojis.cache.get(runes[champ.runes[3]]),
        client.emojis.cache.get(runes[champ.runes[4]]),
      ],
    }

    let starters = '';

    B('div.w-full:nth-child(5) > div:nth-child(2)').children().each(function() {
      starters += `\* ${B(this).children().attr('alt')}\n`;
    });

    let core = '';

    B('div.w-full:nth-child(6) > div:nth-child(2)').children('img').each(function() {
      core += `\> ${B(this).attr('alt')}\n`;
    });

    let late = '';

    B('div.w-full:nth-child(7) > div:nth-child(2)').children().each(function() {
      late += `\> ${B(this).children().attr('alt')}\n`;
    });

    let skillOrder = ['', '', '', ''];

    for (let i = 0; i < 4; ++i) {
      $('div.skill-order').eq(i).children().each(function() {
        if ($(this).hasClass('skill-up'))
          skillOrder[i] += '🔲';
        else if ($(this).hasClass('no-skill-up'))
          skillOrder[i] += '⬛';
      });
    }

    const aramStats = new EmbedBuilder()
      .setColor(0x3273FA)
      .setTitle(`${champ.name} ARAM Statistics`)
      .setURL(url)
      .setAuthor({
        name: 'LordARAM',
        iconURL: 'https://ia800305.us.archive.org/31/items/discordprofilepictures/discordgreen.png',
        url: 'https://github.com/humding3r/lord-ARAM',
      })
      .setDescription(`\*\*Highest Win Rate\*\* info for \*\*${champ.name}\*\*`)
      .setThumbnail(champ.pic)
      .addFields(
        { name: '\*\*Win Rate\*\*', value: champ.wr, inline: true },
        { name: '\*\*Pick Rate\*\*', value: champ.pr, inline: true },
        { name: '\*\*Tier\*\*', value: `${icons.tier}`, inline: true },
        {
          name: '\*\*Skill Order\*\*',
          value: `🇶\t${skillOrder[0]}
                  🇼\t${skillOrder[1]}
                  🇪\t${skillOrder[2]}
                  🇷\t${skillOrder[3]}`
        },
        {
          name: '\*\*Spells\*\*',
          value: `${icons.spells[0]}\t\*${champ.spells[0].charAt(0).toUpperCase() + champ.spells[0].slice(1)}\*
                  ${icons.spells[1]}\t\*${champ.spells[1].charAt(0).toUpperCase() + champ.spells[1].slice(1)}\*`,
          inline: true
        },
        {
          name: '\*\*Runes\*\*',
          value: `${icons.keystone} ${icons.runes[0]} ${icons.runes[1]} ${icons.runes[2]}
                  ${icons.secondary} ${icons.runes[3]} ${icons.runes[4]}`,
          inline: true
        },
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
