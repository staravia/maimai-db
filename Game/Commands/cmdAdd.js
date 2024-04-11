const Crypto = require("crypto");
const getSearchArguments = require("./../Helpers/getSearchArguments.js");
const getAccAndChartAsync = require("./../Helpers/getAccAndChartAsync.js");
const getVersionAndUsers = require("./../Helpers/getVersionAndUsers.js");
const getChartDescription = require("./../Helpers/getChartDescription.js");
const getRatingStats = require("./../Helpers/getRatingStats.js");
const getUserAsync = require("./../Helpers/getUserAsync.js");
const handleUpdateRatingAsync = require("./../Helpers/handleUpdateRatingAsync.js");
const handleDbLogReply = require("./../Helpers/handleDbLogReply.js");
const getTagSuffix = require("./../Helpers/getTagSuffix.js");
const getDbLogString = require("./../Helpers/getDbLogString.js");
const getIsAdmin = require("./../Helpers/getIsAdmin.js");
const { ParameterType, Constants, Commands, Tags } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdAdd(game, msg){
	let args = getSearchArguments(msg.content);
	let chartParams = await getAccAndChartAsync(game, msg, args);
	let userParams = getVersionAndUsers(game, args);

	if (chartParams.args.length == 0){
		const embedb = new EmbedBuilder()
			.setTitle("📰 - Manual Add Score ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(`Manually add or change scores. Just type the song's name/difficulty/dx version and your overall accuracy. Be sure to add suffix \`%\` for accuracy.`);

		msg.reply({ embeds: [embedb], allowedMentions: { repliedUser: false }});
		return;
	}

	if (chartParams.accuracy <= 0 || chartParams.chart == null){
		const invalidDescription = `Cannot add score with given parameters. Be sure to add suffix \`%\` for accuracy.${chartParams.invalidDescription}`;
		const embeda = new EmbedBuilder()
			.setTitle("📰 - Manual Add Score ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(invalidDescription);

		msg.reply({ embeds: [embeda], allowedMentions: { repliedUser: false }});
		msg.react('❌');
		return;
	}

	let msgTitle = "📰 - Score added to database!";
	let stats = getRatingStats(chartParams.accuracy, chartParams.lvl);
	let stats_uni = getRatingStats(chartParams.accuracy, chartParams.chart.const_uni);
	let stats_unip = getRatingStats(chartParams.accuracy, chartParams.chart.const_unip);
	let stats_fes = getRatingStats(chartParams.accuracy, chartParams.chart.const_fes);
	let stats_fesp = getRatingStats(chartParams.accuracy, chartParams.chart.const_fesp);
	let stats_bud = getRatingStats(chartParams.accuracy, chartParams.chart.const_bud);
	let stats_budp = getRatingStats(chartParams.accuracy, chartParams.chart.const_budp);
	let description = ``;
	let tags = getTagSuffix(chartParams.chart.tags, true);
	let chart_description = getChartDescription(chartParams.chart);
	let user_id = msg.author.id;
	if (userParams.users.length > 0){
		if (!getIsAdmin(msg) && user_id != userParams.users[0]){
			const invalidDescription = `You do not have permission to add scores for other players.`;
			const embeda = new EmbedBuilder()
				.setTitle("📰 - Manual Add Score ⚠️") // TODO: CLEAN
				.setColor(0xCC3333)
				.setDescription(invalidDescription);

			msg.reply({ embeds: [embeda], allowedMentions: { repliedUser: false }});
			msg.react('❌');
			return;
		}
		user_id = userParams.users[0];
		let user = await getUserAsync(game, user_id);
		description = `This score has been manually added to \`${user}'s\` records. Existing scores per chart will be overwritten.\n\n`;
	} else {
		description = `This score has been manually added to your records. Existing scores per chart will be overwritten.\n\n`;
	}

	description += `- ${chart_description}\n`;
	description += `- Difficulty: \`${chartParams.chart.difficulty_ref.label} ${chartParams.lvl}${chartParams.chart.dx_ref.short_label}\`\n`;
	description += `- Accuracy: \`${chartParams.accuracy.toFixed(2)}%\`  ${stats.description}`;

	const hash = Crypto.createHash('md5').update(`${msg.author.id}-${chartParams.chart.hash}`);
	const hex = hash.digest('hex');
	const query = `INSERT INTO scores
		(hash, user_id, chart_hash, accuracy, rating_uni, rating_unip, rating_fes, rating_fesp, rating_bud, rating_budp, message_url, date_unix) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(hash) DO UPDATE SET user_id = ?, chart_hash = ?, accuracy = ?, rating_uni = ?, rating_unip = ?, rating_fes = ?, rating_fesp = ?, rating_bud = ?, rating_budp = ?, message_url = ?, date_unix = ?`;

	let date = `${Math.floor(Date.now()/1000)}`;
	date.replace(`.0`, ``);

	let params = [hex, user_id, chartParams.chart.hash, chartParams.accuracy, stats_uni.rating, stats_unip.rating, stats_fes.rating, stats_fesp.rating, stats_bud.rating, stats_budp.rating, ""/*msg.url*/, date, user_id, chartParams.chart.hash, chartParams.accuracy, stats_uni.rating, stats_unip.rating, stats_fes.rating, stats_fesp.rating, stats_bud.rating, stats_budp.rating, ""/*msg.url*/, date];

	let queryLog = getDbLogString(query, params, Commands.ADD.log_string);
	let result = await new Promise((resolve, reject) => {
		game.db.run(query, params
			, function(e) {
			if (e) {
				console.error(`[SCORE]: FAILED to submit score: ${e.message}`, e);
			} else {
				resolve(true);
			}
		});
	});

	const user_stats = await handleUpdateRatingAsync(msg, game, user_id, userParams.version);
	description += `\n- ${user_stats.description}`;
	const attachment = new AttachmentBuilder(`${Constants.ImageDirectory}${chartParams.chart.image_file}`);
	const embed = new EmbedBuilder()
		.setTitle(msgTitle)
		.setColor(stats.rankColor.color)
		.setDescription(description)
		.setThumbnail(`attachment://${chartParams.chart.image_file}`);

	if (result){
		msg.react('✅');
	} else {
		embed.setDescription(`${description}\n⚠️ Failed to upload score into the database!`);
		msg.react('❌');
	}

	handleDbLogReply(queryLog, msg, game);
	msg.reply({ embeds: [embed], files: [attachment], allowedMentions: { repliedUser: false }});
}

module.exports = cmdAdd;
