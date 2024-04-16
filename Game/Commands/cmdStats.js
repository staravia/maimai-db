const getRatingStats = require("./../Helpers/getRatingStats.js");
const getRatingLabel = require("./../Helpers/getRatingLabel.js");
const getTagsStringified = require("./../Helpers/getTagsStringified.js");
const getSearchArguments = require("./../Helpers/getSearchArguments.js");
const getVersionAndUsers = require("./../Helpers/getVersionAndUsers.js");
const getSanitizedChart = require("./../Helpers/getSanitizedChart.js");
const getUserAsync = require("./../Helpers/getUserAsync.js");
const getChartsByPage = require("./../Helpers/getChartsByPage.js");
const getSearchInformation = require("./../Helpers/getSearchInformation.js");
const getChartRendererAsync = require("./../Helpers/getChartRendererAsync.js");
const getDbLogString = require("./../Helpers/getDbLogString.js");
const handleDbLogReply = require("./../Helpers/handleDbLogReply.js");
const handleSetPresence = require("./../Helpers/handleSetPresence.js");
const handlePageButtons = require("./../Helpers/handlePageButtons.js");
const { SearchArgs, Constants, Commands, GameVersion, Locale, Ranks } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdStats(game, msg, increment = 0, cache = null){
	let userParams = null;
	if (cache == null){
		let args = getSearchArguments(msg.content);
		userParams = getVersionAndUsers(game, args);
	} else {
		userParams = cache.userParams;
	}

	if (userParams.users.length == 0){
		await displayLeaderboardsAsync(game, msg, cache, userParams, increment);
	} else {
		await displayUserStatsAsync(game, msg, cache, userParams, increment);
	}
}

async function displayUserStatsAsync(game, msg, cache, userParams, increment = 0){
	let queryLog = ``;
	if (cache == null){
		cache = new SearchArgs();
		cache.command = Commands.STATS;
		cache.page = 0;
		cache.game_version = userParams.version.id;
		cache.diff_version = userParams.version.id;
		cache.userParams = userParams;
		cache.user_id = msg.author.id;

		if (cache.userParams != null && cache.userParams.length > 0){
			cache.username = cache.userParams[0];
		}

		game.requestsCache[msg.author.id] = cache;

		let user_id = userParams.users[0];
		let query = `SELECT * FROM scores JOIN charts ON scores.chart_hash = charts.hash WHERE scores.user_id = ? ORDER BY ${userParams.version.rating_label} DESC`;
		let params = [user_id];
		queryLog = getDbLogString(query, params, Commands.STATS.log_string);

		let scores = await new Promise((resolve, reject) => {
			game.db.all(query, params, (e, scores) => {
				if (e) {
					console.log("[CMD_STATS_user]: Failed to load scores for guild.");
					reject(e);
				} else {
					resolve(scores);
				}
			});
		});

		let user = await getUserAsync(game, user_id);
		let results = [];
		if (scores != null){
			scores.forEach(score => {
				let result = getSanitizedChart(score, cache, true);
				let stats = getRatingStats(result.accuracy, result.lvl);
				result.user = user;
				score.stats = stats;
				results.push(result);
			});
		}

		query = `SELECT * FROM users WHERE id = ?`;
		params = [user_id];
		queryLog += handleDbLogReply(query, params, Commands.STATS.log_string);

		let stats = await new Promise((resolve, reject) => {
			game.db.all(query, params, (e, stats) => {
				if (e) {
					console.log("[CMD_STATS_user]: Failed to load user from guild.");
					reject(e);
				} else {
					resolve(stats);
				}
			});
		});

		if (stats.length == 0){
			const embed = new EmbedBuilder()
				.setTitle(`🏅 - ${user}'s Stats`)
				.setColor(0xCC3333)
				.setDescription(`User does not exist in database.`);

			handleDbLogReply(queryLog, msg, game);
			msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
			return;
		}

		if (results == null || results.length == 0){
			const embed = new EmbedBuilder()
				.setTitle(`🏅 - ${cache.user}'s Stats`)
				.setColor(0xCC3333)
				.setDescription(`User does not have any scores.`);

			handleDbLogReply(queryLog, msg, game);
			msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
			return;
		}

		cache.user = user; // userParams.users;
		cache.stats = stats[0];
		cache.search = { results: results };
	}

	let last_page = Math.floor(cache.search.results.length / Constants.DefaultSmallPageSize);
	if (cache.search.results.length % Constants.DefaultSmallPageSize == 0){
		last_page --;
	}
	cache.page += increment;
	cache.page = Math.min(last_page, Math.max(0, cache.page));

	description = `Viewing stats for \`${cache.user}\`\n`;
	description += `- ${GameVersion.BUDDIESPLUS.label} Rating: \`${getRatingLabel(cache.stats.rating_budp).label}\`  Charts: \`${cache.stats.count_budp}/15\`\n`;
	description += `- ${GameVersion.BUDDIES.label} Rating: \`${getRatingLabel(cache.stats.rating_bud).label}\`  Charts: \`${cache.stats.count_bud}/15\`\n`;
	description += `- ${GameVersion.FESTIVALPLUS.label} Rating: \`${getRatingLabel(cache.stats.rating_fesp).label}\`  Charts: \`${cache.stats.count_fesp}/15\`\n`;
	description += `- ${GameVersion.FESTIVAL.label} Rating: \`${getRatingLabel(cache.stats.rating_fes).label}\`  Charts: \`${cache.stats.count_fes}/15\`\n`;
	description += `- ${GameVersion.UNIVERSEPLUS.label} Rating: \`${getRatingLabel(cache.stats.rating_unip).label}\`  Charts: \`${cache.stats.count_unip}/15\`\n`;
	description += `- ${GameVersion.UNIVERSE.label} Rating: \`${getRatingLabel(cache.stats.rating_uni).label}\`  Charts: \`${cache.stats.count_uni}/15\`\n`;
	description += `Scores Submitted: \`${cache.stats.scores_submitted}\`\n\n`
	description += `### Top Scores\n`;

	let curColor = Ranks.UNRANKED;
	switch (game.game_version) {
		case GameVersion.UNIVERSE.id:
			curColor = getRatingLabel(cache.stats.rating_uni).rankColor;
			break;
		case GameVersion.UNIVERSEPLUS.id:
			curColor = getRatingLabel(cache.stats.rating_unip).rankColor;
			break;
		case GameVersion.FESTIVAL.id:
			curColor = getRatingLabel(cache.stats.rating_fes).rankColor;
			break;
		case GameVersion.FESTIVALPLUS.id:
			curColor = getRatingLabel(cache.stats.rating_fesp).rankColor;
			break;
		case GameVersion.BUDDIES.id:
			curColor = getRatingLabel(cache.stats.rating_bud).rankColor;
			break;
		case GameVersion.BUDDIESPLUS.id:
			curColor = getRatingLabel(cache.stats.rating_budp).rankColor;
			break;
	}

	cache.search = getChartsByPage(cache, Constants.DefaultSmallPageSize);

	let info = getSearchInformation(cache, true, true, Constants.DefaultSmallPageSize);
	description += info.description;

	const renderer = await getChartRendererAsync(cache.search.selected, cache.page, cache.user_id, cache.username);
	const image = await renderer.toBuffer();
	const attachment = new AttachmentBuilder(image, {name: 'maimai-db-render.png'});

	const embed = new EmbedBuilder()
		.setTitle(`🏅 - ${cache.user}'s Stats`) // TODO: CLEAN
		.setColor(curColor.color)
		.setImage('attachment://maimai-db-render.png')
		.setDescription(description)
		.setFooter({text: `${Constants.FooterMessage} \nPage ${cache.page + 1} / ${last_page + 1}`});

	let content = { embeds: [embed], files: [attachment], allowedMentions: { repliedUser: false }};
	handlePageButtons(content, cache.page, last_page);

	if (cache.message == null){
		cache.message = msg;
		handleDbLogReply(queryLog, msg, game);
		msg.reply(content);
	} else {
		msg.edit(content);
	}
}

async function displayLeaderboardsAsync(game, msg, cache, userParams, increment = 0){
	let queryLog = ``;
	if (cache == null){
		cache = new SearchArgs();
		cache.command = Commands.STATS;
		cache.page = 0;
		cache.game_version = userParams.version.id;
		cache.diff_version = userParams.version.id;
		cache.userParams = userParams;
		game.requestsCache[msg.author.id] = cache;

		const query = `SELECT * FROM users ORDER BY ${userParams.version.rating_label} DESC`;
		const params = [];
		queryLog = getDbLogString(query, params, Commands.STATS.log_string);

		let results = await new Promise((resolve, reject) => {
			game.db.all(query, params, (e, users) => {
				if (e) {
					console.log("[CMD_STATS_leaderboards]: Failed to load users for guild.");
					reject(e);
				} else {
					resolve(users);
				}
			});
		});

		let users = [];
		if (userParams.locale.id == Locale.LOCAL.id){
			let members = (await msg.guild.members.fetch()).map(m => m.user.id);
			results.forEach(result => {
				if (members.includes(result.id)){
					users.push(result);
				}
			});
		} else {
			users = results;
		}

		handleSetPresence(game.discord, users.length);
		let cached_users = [];
		for (var i = 0; i < users.length; i++){
			let user = users[i];
			if (cached_users[user.id] == undefined){
				let username = await getUserAsync(game, user.id);
				cached_users[user.id] = username;
			}
		}

		cache.users = users;
		cache.cached_users = cached_users;

		if (cache.users == null){
			cache.users = [];
		}
	}

	let last_page = Math.floor(cache.users.length / Constants.DefaultPageSize);
	if (cache.users.length % Constants.DefaultPageSize == 0 && cache.users.length > 0){
		last_page --;
	}
	cache.page += increment;
	cache.page = Math.min(last_page, Math.max(0, cache.page));

	let msgTitle = `🏅 - db Rating Leaderboards`;
	let description = ``;
	let userCount = 0;
	if (cache.users.length == 0){
		description = `No users found. Upload a score or use \`${Constants.Prefix}add <song name> <accuracy>\` to track scores.`;
	} else {
		for (var i = 0; i < Constants.DefaultPageSize; i++)
		{
			var index = i + cache.page * Constants.DefaultPageSize;
			if (index >= cache.users.length){
				break;
			}

			let user = cache.users[index];
			let rating_cur = user.rating_uni;
			userCount++;

			switch (userParams.version.id) {
				case GameVersion.UNIVERSE.id:
					rating_cur = user.rating_uni;
					break;
				case GameVersion.UNIVERSEPLUS.id:
					rating_cur = user.rating_unip;
					break;
				case GameVersion.FESTIVAL.id:
					rating_cur = user.rating_fes;
					break;
				case GameVersion.FESTIVALPLUS.id:
					rating_cur = user.rating_fesp;
					break;
				case GameVersion.BUDDIES.id:
					rating_cur = user.rating_bud;
					break;
				case GameVersion.BUDDIESPLUS.id:
					rating_cur = user.rating_budp;
					break;
			}

			let ratingLabel = getRatingLabel(rating_cur);
			let submitted = user.scores_submitted == null ? 0 : user.scores_submitted;
			description += `${cache.page * Constants.DefaultPageSize + i + 1}. \`${cache.cached_users[user.id]}\`  Scores Submitted:  \`${submitted}\`  db Rating: ${ratingLabel.label}\n`;
		}

		let pre_description = `Viewing the leaderboards. Type \`${Constants.Prefix}stats <@user>\` for a more detailed summary of that user.\n`;
		pre_description += `- Displaying \`${userCount} user${userCount === 1 ? '' : 's'}\` out of ${cache.users.length} result${cache.users.length === 1 ? '' : 's'}\n`;

		// if (cache.game_version == game.game_version){
		if (userParams.version.id == game.game_version){
			pre_description += `- Version: \`${getTagsStringified(GameVersion, userParams.version.id)} (Server default)\`\n`;
		} else {
			pre_description += `- Version: \`${getTagsStringified(GameVersion, userParams.version.id)}\`\n`;
		}

		pre_description += `- Leaderboards: \`${getTagsStringified(Locale, userParams.locale.id)}\`\n\n`;
		description = `${pre_description}${description}`;
	}

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

module.exports = cmdStats;
