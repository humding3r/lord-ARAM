const { token } = require("./config.json");
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, Collection } = require("discord.js");
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildEmojisAndStickers,
  ]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.on('ready', () => {
  console.log('LordARAM is online!');
});

client.once(Events.ClientReady, async c => {
  console.log(`Logged in as ${c.user.tag}`);
  client.application.commands.set(client.commands.map(cmd => cmd.data));
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand())
    return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Error executing command /aram', ephemeral: true });
  }
});

client.login(token);
