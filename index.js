const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, PermissionFlagsBits } = require('discord.js');
const config = require('./config.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();
const commands = [];

const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) {
  fs.mkdirSync(commandsPath);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[WARNING] Der Command bei ${filePath} hat keine "data" oder "execute" Eigenschaft.`);
  }
}

client.once('ready', async () => {
  console.log(`Bot eingeloggt als ${client.user.tag}`);
  try {
    console.log('Slash-Commands werden registriert...');
    await client.application.commands.set(commands);
    console.log('Slash-Commands erfolgreich registriert!');
  } catch (error) {
    console.error('Fehler beim Registrieren der Slash-Commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Check if user has Support Role or is Admin
  const isSupport = interaction.member.roles.cache.has(config.supportRoleId);
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

  if (!isSupport && !isAdmin) {
    return interaction.reply({
      content: '❌ Du hast keine Berechtigung, diesen Command auszuführen! (Support-Rolle oder Administrator benötigt)',
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Fehler bei der Ausführung von /${interaction.commandName}:`, error);
    const errorMsg = '❌ Es gab einen internen Fehler bei der Ausführung dieses Commands!';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMsg, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }
  }
});

client.login(config.botToken);
