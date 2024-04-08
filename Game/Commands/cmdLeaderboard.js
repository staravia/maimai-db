
const getRatingLabel = require("./../Helpers/getRatingLabel.js");
const getTagsStringified = require("./../Helpers/getTagsStringified.js");
const getSearchArguments = require("./../Helpers/getSearchArguments.js");
const getVersionAndUsers = require("./../Helpers/getVersionAndUsers.js");
const handleDbLogReply = require("./../Helpers/handleDbLogReply.js");
const handleSetPresence = require("./../Helpers/handleSetPresence.js");
const handlePageButtons = require("./../Helpers/handlePageButtons.js");
const handleApiCalls = require("./../Helpers/handleApiCalls.js");
const grpc = require('@grpc/grpc-js');
const Secrets = require("./../Secrets/secrets.js");
const { SearchArgs, Constants, Commands, GameVersion, Locale, Ranks } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdLeaderboard(game, msg, increment = 0, cache = null){
	let userParams = null;
	if (cache == null){
		let args = getSearchArguments(msg.content);
		userParams = getVersionAndUsers(game, args);
	} else {
		userParams = cache.userParams;
	}

	if (userParams.users.length == 0){
		await displayMythosLeaderboardsAsync(game, msg, cache, userParams, increment);
	} else {
		// TODO: implement this after mythos has user profiles
		// await displayUserStatsAsync(game, msg, cache, userParams, increment);

		await displayMythosLeaderboardsAsync(game, msg, cache, userParams, increment);
	}
}

async function displayMythosLeaderboardsAsync(game, msg, cache, userParams, increment = 0) {
	// If cache is not null, just send a message. Otherwise request mythos API data.
	if (cache != null){
		handleLeaderboardsMessage(game, msg, cache, userParams, increment);
		return;
	}

	proto = handleApiCalls("leaderboard");

	try {
		var client = new proto.MaimaiLeaderboard(Secrets.MYTHOS, grpc.credentials.createSsl());
	} catch {
		msg.reply("Oops! The administrator has not set up Mythos API support yet, please contact your local dev!")
		return;
	}

	const requestMetadata = new grpc.Metadata();
	requestMetadata.add('Authorization', `${Secrets.MYTHOS_API}`)


	var response = await new Promise((resolve, reject) => {
	    client.GetRating({ "": "" }, requestMetadata, function(err, res) {
	        if (!err) {
	            resolve(res);
	        } else {
	            reject(err);
	        }
	    });
	});

	if (!response){
		msg.reply("Oops! The administrator has not set up Mythos API support yet, please contact your local dev!")
		return;
	}

	// client.GetRating({"":""}, requestMetadata, async function(err, response) {
	leaderboard = response.entries
	cache = new SearchArgs();
	cache.command = Commands.LEADERBOARD;
	cache.page = 0;
	cache.game_version = userParams.version.id;
	cache.diff_version = userParams.version.id;
	cache.userParams = userParams;
	game.requestsCache[msg.author.id] = cache;

	let users = [];
	for (i = 0; i < leaderboard.length; i++){
		users.push(await leaderboard[i])
	}

	let cached_users = [];
	for (var i = 0; i < users.length; i++){
		let user = users[i];
		if (cached_users[user.user_name] == undefined){
			let username = user.user_name
			cached_users[user.user_name] = username;
		}
	}

	cache.users = users;
	cache.cached_users = cached_users;

	if (cache.users == null){
		cache.users = [];
	}
	handleLeaderboardsMessage(game, msg, cache, userParams, increment);
}

function handleLeaderboardsMessage(game, msg, cache, userParams, increment){
	let queryLog = ``;
	let last_page = Math.floor(cache.users.length / Constants.DefaultPageSize);
	if (cache.users.length % Constants.DefaultPageSize == 0 && cache.users.length > 0){
		last_page --;
	}
	cache.page += increment;
	cache.page = Math.min(last_page, Math.max(0, cache.page));

	let msgTitle = `🏅 - Mythos Rating Leaderboards`;
	let description = ``;
	let userCount = 0;

		for (var i = 0; i < Constants.DefaultPageSize; i++)
		{
			var index = i + cache.page * Constants.DefaultPageSize;
			if (index >= cache.users.length){
				break;
			}

			let user = cache.users[index];
			let rating_cur = user.player_rating;
			userCount++;

			let ratingLabel = getRatingLabel(rating_cur);
			let submitted = user.scores_submitted == null ? 0 : user.scores_submitted;
			description += `${cache.page * Constants.DefaultPageSize + i + 1}. \`${cache.cached_users[user.user_name]}\`  Mythos Rating: ${ratingLabel.label}\n`;
		}

		// let pre_description = `Viewing the current Mythos leaderboards. Type \`${Constants.Prefix}stats <@user>\` for a more detailed summary of that user. (UNFINISHED)\n`;
		let pre_description = `Viewing the current Mythos leaderboards. This feature is still under development. \n`;

		pre_description += `- Displaying \`${userCount} user${userCount === 1 ? '' : 's'}\` out of ${cache.users.length} result${cache.users.length === 1 ? '' : 's'}\n`;

		// if (cache.game_version == game.game_version){
		if (userParams.version.id == game.game_version){
			pre_description += `- Version: \`FESTiVAL PLUS (Mythos)\`\n`;
		} else {
			pre_description += `- Version: \`FESTiVAL PLUS\`\n`;
		}

		pre_description += `\n`;
		description = `${pre_description}${description}`;


	const embed = new EmbedBuilder()
		.setTitle(msgTitle) // TODO: CLEAN
		.setColor(0xEEEEEE)
		.setDescription(description)
		.setFooter({text: `${Constants.FooterMessage} \nPage ${cache.page + 1} / ${last_page + 1}`});

	let content = { embeds: [embed], allowedMentions: { repliedUser: false }};
	handlePageButtons(content, cache.page, last_page);

	if (cache.message == null){
		cache.message = msg;
		handleDbLogReply(queryLog, msg, game);
		msg.reply(content);
	} else {
		msg.edit(content);
	}
}

module.exports = cmdLeaderboard;
