const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');
const { Constants, Commands } = require("./constants.js");
const getIsScorePostAsync = require("./Helpers/getIsScorePostAsync.js");
const getCommand = require("./Helpers/getCommand.js");

module.exports = class Game {
	constructor(db, id, commands, discord, google, cache, game_version, international_version, db_channel_id, scores_channel_id){
		this.db = db;
		this.id = id;
		this.discord = discord;
		this.google = google;
		this.cache = cache;
		this.game_version = game_version;
		this.international_version = international_version;
		this.requestsCache = [];
		this.debug = false;
		this.db_channel_id = db_channel_id;
		this.scores_channel_id = scores_channel_id
		this.commands = commands
	}

  handleOnMessage(msg, userData){
    // Ignore bots
    if (msg.author.bot){
      return;
		}

		if (msg.channel.id == this.db_channel_id || msg.channel.id  == this.scores_channel_id)
		{
			getIsScorePostAsync(this, msg);
		}

    // Check to see if player wants to execute a command
    if (!msg.content.startsWith(Constants.Prefix)){
    	return;
    }

    var cmd = getCommand(msg.content);
		switch(cmd){
			case Commands.SETSCORESCHANNEL:
				this.commands.cmdSetScoresChannel(this, msg);
				return;
			case Commands.SETDBCHANNEL:
				this.commands.cmdSetDbChannel(this, msg);
				return;
		}

		if (msg.channel.id != this.db_channel_id && cmd != null){
			msg.react('❌');
			if (this.db_channel_id != '-1' && this.db_channel_id != '0' && this.db_channel_id != ''){
				msg.reply({content: `You may only use this command in <#${this.db_channel_id}>`, allowedMentions: {repliedUser: false}});
			} else {
				msg.reply({content: `There is no db channel set for this server. Admins, please use \`m!setdbchannel <#channel>\`.`, allowedMentions: {repliedUser: false}});
			}
			return;
		}

    switch(cmd){
			case Commands.HELP:
				this.commands.cmdHelp(this, msg);
				return;
			case Commands.SEARCH:
				this.commands.cmdSearch(this, msg);
				return;
      case Commands.RANDOM:
        this.commands.cmdRandom(this, msg);
        return;
			case Commands.CALC:
				this.commands.cmdCalc(this, msg);
				return;
			case Commands.AMAKAGE:
				this.commands.cmdAmakage(msg);
				return;
			case Commands.TOP:
				this.commands.cmdTop(this, msg);
				return;
			case Commands.STATS:
				this.commands.cmdStats(this, msg);
				return;
			case Commands.ADD:
				this.commands.cmdAdd(this, msg);
				return;
			case Commands.REMOVE:
				this.commands.cmdRemove(this, msg);
				return;
			case Commands.IMAGE:
				this.commands.cmdImage(this, msg);
				return;
			case Commands.BOOK:
				this.commands.cmdBook(this, msg);
				return;
			case Commands.SETALIAS:
				this.commands.cmdSetAlias(this, msg);
				return;
			case Commands.SETVERSION:
				this.commands.cmdSetVersion(this, msg);
				return;
			case Commands.SETDEBUG:
				this.commands.cmdSetDebug(this, msg);
				return;
			case Commands.SETTAGS:
				this.commands.cmdSetTags(this, msg);
				return;
			case Commands.STATUS:
				this.commands.cmdStatus(this, msg);
				return;
			case Commands.CREDITS:
				this.commands.cmdCredits(this, msg);
				return;
			case Commands.MYTHOS:
				this.commands.cmdMythos(this, msg);
				return;
    }
	}

	// TODO: add to constants
	onInteractionCreate(interaction){
		switch (interaction.customId) {
			case 'reroll':
				handleReroll(this, interaction);
				break;
			case 'page-next':
				handleSearchPage(this, interaction, 1);
			break;
			case 'page-prev':
				handleSearchPage(this, interaction, -1);
			break;
			case 'page-first':
				handleSearchPage(this, interaction, -999999);
			break;
			case 'page-last':
				handleSearchPage(this, interaction, 999999);
			break;
		}
	}
}

async function handleSearchPage(game, interaction, increment){
	request = null;
	Object.values(game.requestsCache).forEach(args => {
		if (args != undefined  && args.message != undefined && args.message.id && args.message.id == interaction.message.reference.messageId){
			request = args;
		}
	});

	if (request == null || interaction == null){
		return;
	}

	switch(request.command){
		case Commands.TOP:
			await game.commands.cmdTop(game, interaction.message, increment, request);
			break;
		case Commands.SEARCH:
			await game.commands.cmdSearch(game, interaction.message, increment, request);
			break;
		case Commands.STATS:
			await game.commands.cmdStats(game, interaction.message, increment, request);
			break;
		case Commands.BOOK:
			await game.commands.cmdBook(game, interaction.message, increment, request);
			break;
		case Commands.HELP:
			await game.commands.cmdHelp(game, interaction.message, increment, request);
			break;
		case Commands.MYTHOS:
			await game.commands.cmdMythos(game, interaction.message, increment, request);
			break;
	}

	interaction.deferUpdate();
}

async function handleReroll(game, interaction){
	request = null;
	Object.values(game.requestsCache).forEach(args => {
		if (args != undefined  && args.message != undefined && args.message.id && args.message.id == interaction.message.reference.messageId){
			request = args;
		}
	});

	if (request == null){
		return;
	}

	if (request.message.author.id != interaction.user.id){
		await interaction.channel.send({content: `${interaction.user} You cannot reroll songs for other people.`, allowedMentions: { repliedUser: false }});
		interaction.deferUpdate();
		return;
	}

	await game.commands.cmdRandom(game, interaction.message, request);
	interaction.deferUpdate();
}
