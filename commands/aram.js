const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAramStats } = require('../utils/getAramStats');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aram')
    .setDescription('Get ARAM stats for a champion')
    .addStringOption(option =>
      option.setName('champion')
        .setDescription('The name of the champion')
        .setRequired(true)),
  async execute(interaction, client) {
    const champName = interaction.options.getString("champion");

    try {
      const aramData = await getAramStats(champName.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()), client);
      await interaction.reply({ embeds: [aramData] });
    } catch (error) {
      console.error(error);
      await interaction.reply("Error fetching ARAM data.");
    }
  },
}
