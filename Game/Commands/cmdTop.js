const getUserAsync = require("./../Helpers/getUserAsync.js");
const getVersionAndUsers = require("./../Helpers/getVersionAndUsers.js");
const getAllChartsAsync = require("./../Helpers/getAllChartsAsync.js");
const getSanitizedChart = require("./../Helpers/getSanitizedChart.js");
const getRatingStats = require("./../Helpers/getRatingStats.js");
const getSearchInformation = require("./../Helpers/getSearchInformation.js");
const getChartsByPage = require("./../Helpers/getChartsByPage.js");
const getSearchArguments = require("./../Helpers/getSearchArguments.js");
const getChartRendererAsync = require("./../Helpers/getChartRendererAsync.js");
const handlePageButtons = require("./../Helpers/handlePageButtons.js");
const handleSearchArguments = require("./../Helpers/handleSearchArguments.js");
const { Commands, Constants } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdTop(game, msg, increment = 0, cache = null){
	let scores = [];
	let queryLog = ``;
	if (cache == null){
		let args = getSearchArguments(msg.content);
		cache = handleSearchArguments(game, msg.content.replace(`${Constants.Prefix}top`, `${Constants.Prefix}search`), null, msg);

		let userParams = getVersionAndUsers(game, args);
		cache.command = Commands.TOP;
		cache.users = userParams.users;
		cache.user_id = msg.author.id;

		if (userParams.users != null && userParams.users.length > 0){
			cache.username = userParams.users[0];
		}

		let chartResult = await getAllChartsAsync(game, msg, cache, true);
		if (chartResult != null && chartResult.results != undefined){
			scores = chartResult.results;
		}

		cache.message = null;
		let results = [];

		// TODO: only sanitize 20 loaded charts, NOT ALL
		// for (var i = 0; i < scores.length; i++){
		// 	let score = scores[i];
		//
		// 	score.user = score.user_id; // await getUserAsync(game, score.user_id);
		// 	score = getSanitizedChart(score, cache, true);
		// 	let stats = getRatingStats(score.accuracy, score.lvl);
		// 	score.stats = stats;
		//
		// 	// console.log("YO");
		// 	if (score.lvl > 0){
		// 		// console.log(score);
		// 		results.push(score);
		// 	}
		// }

		cache.search = chartResult;
		cache.search.results = scores; // results;  //, chart: chartParams.chart };
		scores = results;
	} else {
		scores = cache.search.results;
	}

	let last_page = Math.floor(cache.search.results.length / Constants.DefaultPageSize);
	if (cache.search.results.length % Constants.DefaultPageSize == 0 && scores.length > 0){
		last_page --;
	}
	cache.page += increment;
	cache.page = Math.max(0, Math.min(last_page, cache.page));

	let found = false;
	let charts = [];
	let chartSearchFound = cache.search != null && cache.search.chart != null;
	cache.search = getChartsByPage(cache, Constants.DefaultPageSize);

	// New code... Only sanitize relevant charts
	scores = cache.search.selected;
	for (var i = 0; i < scores.length; i++){
		let score = cache.search.selected[i];

		score.user = await getUserAsync(game, score.user_id);
		score = getSanitizedChart(score, cache, true);
		let stats = getRatingStats(score.accuracy, score.lvl);
		score.stats = stats;

		cache.search.selected[i] = score;
	}






	let info = getSearchInformation(cache, true);
	let description = info.description;

	if (cache.search.selected.length > 0){
		let msgTitle = `🏆 - Top Scores`;
		if (cache.users.length == 0){
			msgTitle = `${msgTitle} 📖 ${cache.page + 1} / ${last_page + 1}`;
		} else if (cache.users.length == 1){
			msgTitle = `${msgTitle} for ${scores[0].user} 📖 ${cache.page + 1} / ${last_page + 1}`;
		} else {
			msgTitle = `${msgTitle} for ${cache.users.length} users 📖 ${cache.page + 1} / ${last_page + 1}`;
		}

		const renderer = await getChartRendererAsync(cache.search.selected, cache.page, cache.user_id, cache.username);
		const image = await renderer.toBuffer();
		const attachment = new AttachmentBuilder(image, {name: 'maimai-db-render.png'});
		const embed = new EmbedBuilder()
			.setTitle(msgTitle) // TODO: CLEAN
			.setColor(0xEEEEEE)
			.setImage('attachment://maimai-db-render.png')
			.setDescription(description)
			.setFooter({text: `${Constants.FooterMessage} \nPage ${cache.page + 1} / ${last_page + 1}`});

		let content = { embeds: [embed], files: [attachment], allowedMentions: { repliedUser: false }};

		// Send the embedded message with the merged image as an attachment
		handlePageButtons(content, cache.page, last_page);

		if (cache.message == null){
			cache.message = msg;
			msg.reply(content);
		} else {
			msg.edit(content);
		}
	} else {
		if (cache == null || cache.users == null || cache.users == undefined){
			description = "Failed to load scores."
		} else {
			description = `No scores could be found in this server with the following parameters.\n${description}`;
		}

		const embed = new EmbedBuilder()
			.setTitle("🏆 - Top Scores ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(description);

		const content = { embeds: [embed], allowedMentions: { repliedUser: false }};
		if (cache.message == null){
			cache.message = msg;
			msg.reply(content);
		} else {
			msg.edit(content);
		}
	}
}

module.exports = cmdTop;
