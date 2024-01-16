const getSearchArguments = require("./../Helpers/getSearchArguments.js");
const getVersionAndUsers = require("./../Helpers/getVersionAndUsers.js");
const getChartDescription = require("./../Helpers/getChartDescription.js");
const handleDbLogReply = require("./../Helpers/handleDbLogReply.js");
const handleUpdateRatingAsync = require("./../Helpers/handleUpdateRatingAsync.js");
const getAccAndChartAsync = require("./../Helpers/getAccAndChartAsync.js");
const getTagSuffix = require("./../Helpers/getTagSuffix.js");
const getUserAsync = require("./../Helpers/getUserAsync.js");
const getDbLogString = require("./../Helpers/getDbLogString.js");
const getIsAdmin = require("./../Helpers/getIsAdmin.js");
const { ParameterType, Constants, Commands, Tags } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdRemove(game, msg){
	let args = getSearchArguments(msg.content);
	let chartParams = await getAccAndChartAsync(game, msg, args);
	let userParams = getVersionAndUsers(game, args);

	if (chartParams.args.length == 0){
		const embedb = new EmbedBuilder()
			.setTitle("🗑️ - Manual Remove Score ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(`Manually remove scores. Just type the song's name/difficulty/dx version. Be sure to add suffix \`%\` for accuracy.`);

		msg.reply({ embeds: [embedb], allowedMentions: { repliedUser: false }});
		return;
	}

	if (chartParams.chart == null){
		const invalidDescription = `Cannot add score with given chartParams. Be sure to add suffix \`%\` for accuracy.${chartParams.invalidDescription}`;
		const embeda = new EmbedBuilder()
			.setTitle("🗑️ - Manual Remove Score ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(invalidDescription);

		msg.reply({ embeds: [embeda], allowedMentions: { repliedUser: false }});
		msg.react('❌');
		return;
	}

	let description = ``;
	let tags = getTagSuffix(chartParams.chart.tags, true);
	let chart_description = getChartDescription(chartParams.chart);
	let user_id = msg.author.id;
	description += `- ${chart_description}\n`;
	description += `- Difficulty: \`${chartParams.chart.difficulty_ref.label} ${chartParams.lvl}${chartParams.chart.dx_ref.short_label}\`\n`;

	if (userParams.users.length > 0){
		if (!getIsAdmin(msg) && user_id != userParams.users[0]){
			const invalidDescription = `You do not have permission to remove scores for other players.`;
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
	}

	let query = `DELETE FROM scores WHERE user_id = ? AND chart_hash = ?`;
	let params = [user_id, chartParams.chart.hash];
	let queryLog = getDbLogString(query, params, Commands.REMOVE.log_string);

	let result = await new Promise((resolve, reject) => {
		game.db.run(query, params
			, function(e) {
			if (e) {
				console.error(`[SCORE]: Failed to delete score: ${chart_description}`, e);
				resolve(false);
			} else {
				resolve(this.changes == 1);
			}
		});
	});

	if (!result){
		const embedb = new EmbedBuilder()
			.setTitle("🗑️ - Manual Remove Score ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(`I cannot find a score with the following parameters to remove:\n\n${description}`);

		msg.reply({ embeds: [embedb], allowedMentions: { repliedUser: false }});
		return;
	}

	if (userParams.users.length > 0){
		description = `This score has been manually removed from \`${user}'s\` records. \n\n${description}`;
	} else {
		description = `This score has been manually removed from your records. \n\n${description}`;
	}

	const user_stats = await handleUpdateRatingAsync(msg, game, user_id, userParams.version);
	description += `- ${user_stats.description}`;
	const attachment = new AttachmentBuilder(`${Constants.ImageDirectory}${chartParams.chart.image_file}`);
	const embed = new EmbedBuilder()
		.setTitle("🗑️ - Score removed from database!")
		.setColor(0x753232)
		// .setColor(stats.rankColor.color)
		.setDescription(description)
		.setThumbnail(`attachment://${chartParams.chart.image_file}`);

	handleDbLogReply(queryLog, msg, game);
	msg.react('✅');
	msg.reply({ embeds: [embed], files: [attachment], allowedMentions: { repliedUser: false }});
}

module.exports = cmdRemove;
