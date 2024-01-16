const sqlite3 = require("sqlite3");
const fs = require("fs");
const path = require('path');
const db = new sqlite3.Database('maimai-db.db');
const handleSetPresence = require('./Game/Helpers/handleSetPresence.js');
const handleInitDatabaseAsync = require('./Game/Helpers/handleInitDatabaseAsync.js');
const handleSyncSheetsAsync = require('./Game/Helpers/handleSyncSheetsAsync.js');

const Game = require("./Game/maimai-db.js");
const Secrets = require("./Game/Secrets/secrets.js");
const SongDataTsv = "./maimai db - database.tsv";
const Commands = importCommands();

const { JWT } = require('google-auth-library');
const { Client, IntentsBitField, AttachmentBuilder, EmbedBuilder, ActivityType } = require('discord.js');
const { Difficulties, Categories, DxVersion, GameVersion, Tags } = require("./Game/constants.js");

const googleClient = new JWT({
	keyFile: Secrets.TOKEN_KEYFILE,
	scopes: Secrets.SCOPES,
});

const discord = new Client(
  { intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent]
});

var instances = [];
var users = [];
var guilds = [];
var cache = {
	usernames: {}
};

function importCommands() {
  const commands = {};
  const commandFiles = fs.readdirSync(path.join(__dirname, '/Game/Commands')).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(__dirname, '/Game/Commands', file));
    const commandName = file.replace('.js', '');
    commands[commandName] = command;
		console.log(`[INIT]: Command Loaded: ${commandName}`);
  }

  return commands;
}

// Console.Log on Error
function handleError(e, msg = null){
  if (msg === null || msg === undefined)
    console.log("[ERROR]: " + e.message + "\n" + e.stack);
  else
    console.log("[ERROR]: author: " + msg.author.tag + " - contents: " + msg.contents + "\n" + e.message + "\n" + e.stack);
}

// Save User Stats
function saveUserData(user) {
  console.log("[SAVE USER DATA]: Saved stats for user " + user.tag);
  db.ref(`users/${user.id}`).set(users[user.id]);
}

// Save Guild Stats
function saveGuildData(guild){
  console.log("[SAVE GUILD DATA]: Saved stats for guild " + guild.name);
  db.ref(`guilds/${guild.id}`).set(guilds[guild.id]);
}

// Handle Event Subscriptions for a guild
async function handleGuildAttach(guildId){
  return await new Promise((accept, reject) => {
    const query = `INSERT OR IGNORE INTO guilds (id, game_version, international_version) VALUES (${guildId.toString()}, ${GameVersion.FESTIVAL.id}, ${false})`;
    instances[guildId] = new Game(db, guildId, Commands, discord, googleClient, cache, GameVersion.FESTIVAL.id, false, "-1", "-1");
    db.run(query);
    console.log(`[GUILD JOIN]: Guild has been created ${guildId}`);
    updatePresenceAsync();
  });
}

// Handle Event Unsubscriptions for a guild
function handleGuildDetach(guildId){
  console.log(`[GUILD LEAVE]: Guild has been removed ${guildId}`);
  delete instances[guildId];
  updatePresenceAsync();
}

async function updatePresenceAsync(){
	let query = `SELECT * FROM users`;
	let users = await new Promise((resolve, reject) => {
		db.all(query, (e, results) => {
			if (e) {
				console.log("[CMD_STATS_user]: Failed to fetch user.");
				reject(e);
			} else {
				resolve(results);
			}
		});
	});

	handleSetPresence(discord, users.length);
}

// Bot Ready
discord.on("ready", (member) => {
  const query = `SELECT * from guilds`;
  db.all(query, (e, guilds) => {
    if (guilds != null) {
      guilds.forEach(guild => {
        instances[guild.id] = new Game(db, guild.id, Commands, discord, googleClient, cache, guild.game_version, guild.international_version, guild.db_channel_id, guild.scores_channel_id);
      });
    } else {
      console.log(`[INIT]: No guilds were found.`);
    }
  });

	updatePresenceAsync();
});

// Bot Joined Server
discord.on("guildCreate", (guild) => {
  try {
    let guildId = guild.id;
    if (instances[guildId] === null || instances[guildId] === undefined){
      privateMessage(`Joining guild: ${guild.name} - ${guild.memberCount}`);
      handleGuildAttach(guild.id);
    }
  }
  catch (e){
    handleError(e);
  }
});

async function privateMessage(str){
  let wubbo = await discord.users.fetch('148332220120039424');
  wubbo.send(str);
}

// Bot Got Kicked
discord.on("guildDelete", (guild) => {
  try {
    privateMessage(`Leaving guild: ${guild.name}`);
    handleGuildDetach(guild.id);
  }
  catch (e){
    handleError(e);
  }
});

// User Sent Message
discord.on("messageCreate", (msg) => {
  try {
    if (instances[msg.guild.id] === undefined || instances[msg.guild.id] === null){
      handleGuildAttach(msg.guild.id);
      setTimeout(() => {
          instances[msg.guild.id].handleOnMessage(msg, users[msg.author.id]);
        }, 1000);
    } else if (msg.author.id == '148332220120039424' && msg.content == 'm!sync') {
      handleSyncSheetsAsync(googleClient, db, msg);
    } else {
      instances[msg.guild.id].handleOnMessage(msg, users[msg.author.id]);
    }
  } catch(e) {
    msg.channel.send(`Error: \`${e.message}\``);
  }
});

discord.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    Object.values(instances).forEach((game) => {
      if (game != null){
        game.onInteractionCreate(interaction);
      }
    });
  }
});

async function init(){
  await handleInitDatabaseAsync(db);
  // await handleSyncSheetsAsync(googleClient, db);
  await discord.login(Secrets.CLIENT_TOKEN);
  let date = `${Math.floor(Date.now()/1000)}`;
  privateMessage(`Bot is ready. <t:${date}:R>`);
}

init();
