const { DxVersion, Constants, Commands } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');
const handleDbLogReply = require("./handleDbLogReply.js");
const handleUpdateRatingAsync = require("./handleUpdateRatingAsync.js");
const getChartAsync = require("./getChartAsync.js");
const getGrade = require("./getGrade.js");
const getRatingStats = require("./getRatingStats.js");
const getChartDescription = require("./getChartDescription.js");
const getDbLogString = require("./getDbLogString.js");
const getResultsFromImage  = require("./../Ocr/scores-ocr.js");
const Crypto = require("crypto");

async function getIsScorePostAsync(game, msg){
	if (msg.attachments == null || msg.attachments == undefined || msg.attachments.length == 0) {
		return;
	}

	let results = [];
	let embeds = [];
	let attachments = [];
	let successCount = 0;
	let totalCount = 0;
	for (const attachment of msg.attachments) {
		if (!attachmentIsImage(attachment)){
			continue;
		}

		var imageResult = await getResultsFromImage(attachment[1].url);
		handleDbLogReply(imageResult.queryLog, msg, game);
		if (imageResult == null || imageResult.result == null){
			continue;
		}

		let result = imageResult.result;
		totalCount++;
		if (result.accScore == undefined || result.accScore < 1 || result.accScore > 101.1 ){
			// msg.react('❌');
			continue;
		}

		let dxVersion = 0;
		if (result.isDx && !result.isStandard){
			dxVersion = DxVersion.DX.id;
		} else if (!result.isDx && result.isStandard){
			dxVersion = DxVersion.ST.id;
		}

		if (result.diffVersion != null && result.diffVersion != undefined && result.lvlFoundMin == 0){
			// result.lvlFoundMin = 1;
			// result.lvlFoundMax = 14;
			continue;
		}

		let chart = await getChartAsync(msg, game, result.diffVersion, result.possible_songs, result.lvlFoundMin, result.lvlFoundMax, dxVersion);
		if (chart == null){
			// msg.react('❌');
			continue;
		}

		let pbMessage = "No";
		if (result.isPb){
			pbMessage = "Yes";
		}

		let grade = getGrade(result.accScore);
		let multiplier = grade.multiplier;

		if (chart.lvl < 1 || result.accScore < 1){
			// msg.react('❌');
			continue;
		}

		let stats_uni = getRatingStats(result.accScore, chart.const_uni);
		let stats_unip = getRatingStats(result.accScore, chart.const_unip);
		let stats_fes = getRatingStats(result.accScore, chart.const_fes);
		let stats_fesp = getRatingStats(result.accScore, chart.const_fesp);
		let stats_bud = getRatingStats(result.accScore, chart.const_bud);
		let stats_budp = getRatingStats(result.accScore, chart.const_budp);
		let stats_cur = getRatingStats(result.accScore, chart.lvl);
		let embedTitle = getChartDescription(chart);
		let message = ``;// `- New Record: \`Using highest score.\`\n`; // `- New Record: \`${msg.author.username} - ${pbMessage}\`\n`;
		message += (`- Accuracy: \`${result.accScore}%\`\n`);
		message += `- ${stats_cur.description}`;

		const thumbnail = new AttachmentBuilder(`${Constants.ImageDirectory}${chart.image_file}`);
		const embed = new EmbedBuilder()
			.setTitle(embedTitle)
			.setColor(stats_cur.rankColor.color)
			.setDescription(message)
			.setThumbnail(`attachment://${chart.image_file}`);

		attachments.push(thumbnail);
		embeds.push(embed);
		results.push({accuracy: result.accScore, stats_uni: stats_uni, stats_unip: stats_unip, stats_fes: stats_fes, stats_fesp: stats_fesp, stats_bud: stats_bud, stats_budp: stats_budp, chart_hash: chart.hash, song_info: embedTitle});
  }

	const user_id = msg.author.id;
	let submit_success = true;
	let submit_count = 0;
	let date = `${Math.floor(Date.now()/1000)}`;
	date.replace(`.0`, ``);

	let queryLog = ``;
	await new Promise((resolve, reject) => {
    game.db.serialize(() => {
			results.forEach((result, index) => {
				const hash = Crypto.createHash('md5').update(`${user_id}-${result.chart_hash}`);
				const hex = hash.digest('hex');
				const query = `INSERT INTO scores
					(hash, user_id, chart_hash, accuracy, rating_uni, rating_unip, rating_fes, rating_fesp, rating_bud, rating_budp, message_url, date_unix) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(hash) DO UPDATE SET user_id = ?, chart_hash = ?, accuracy = ?, rating_uni = ?, rating_unip = ?, rating_fes = ?, rating_fesp = ?, rating_bud = ?, rating_budp = ?, message_url = ?, date_unix = ?`;
				let params = [hex, user_id, result.chart_hash, result.accuracy, result.stats_uni.rating, result.stats_unip.rating, result.stats_fes.rating, result.stats_fesp.rating, result.stats_bud.rating, result.stats_budp.rating, msg.url, date, user_id, result.chart_hash, result.accuracy, result.stats_uni.rating, result.stats_unip.rating, result.stats_fes.rating, result.stats_fesp.rating, result.stats_bud.rating, result.stats_budp.rating, msg.url, date];

				queryLog += getDbLogString(query, params, Commands.TOP.log_string);

				game.db.run(query, params
					, function(e) {
					if (e) {
						console.error(`[SCORE]: Failed to submit score: ${msg.author} - ${result.song_info}`, e);
						submit_success = false;
					} else {
						submit_count++;
					}
					// TODO: there might be case where LAST song is not a re:master
					if (index == results.length - 1) {
						console.log(`[SCORE]: SUCCESS in submitting ${submit_count} score${submit_count < 2 ? '' : 's'}!`);
						resolve();
					}
				});
			});
		});
	});

	const user_stats = await handleUpdateRatingAsync(msg, game, user_id);
	handleDbLogReply(queryLog, msg, game);

	if (embeds.length > 0){
		if (submit_count == totalCount){
			msg.react('🌟');
		} else if (submit_count >= 1){
			msg.react('⭐');
		}

		if (msg.channel.id == game.db_channel_id)
		{
			msg.reply({ content: `Submitted \`${submit_count}\` score${submit_count < 2 ? '' : 's'}. ${user_stats.description}\n- Any existing scores will be overwritten.\n\n`, embeds: embeds, files: attachments, allowedMentions: { repliedUser: false }});
		}
		else {
			let url = msg.url;
			let channel = game.discord.channels.cache.get(game.db_channel_id);
			channel.send({ content: `<@${msg.author.id}> ${url}\n- Submitted \`${submit_count}\` score${submit_count < 2 ? '' : 's'}. ${user_stats.description}\n - Any existing scores will be overwritten.\n\n`, embeds: embeds, files: attachments, allowedMentions: { repliedUser: false }});
		}
	}
}

function attachmentIsImage(attachment) {
	if (attachment == null || attachment.length < 2 || attachment[1] == null){
		return false;
	}

  var url = attachment[1].url;
	if (url == null)
		return false;

	var isImg = url.indexOf(".png") > 0 || url.indexOf(".jpg") > 0 || url.indexOf(".jpeg") > 0 || url.indexOf(".webp") > 0;
  return isImg;
}

module.exports = getIsScorePostAsync;
