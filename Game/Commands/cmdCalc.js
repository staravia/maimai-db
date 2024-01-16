const getAccAndChartAsync = require("./../Helpers/getAccAndChartAsync.js");
const getRatingStats = require("./../Helpers/getRatingStats.js");
const getTagSuffix = require("./../Helpers/getTagSuffix.js");
const getChartDescription = require("./../Helpers/getChartDescription.js");
const { Constants } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdCalc(game, msg){
	let parameters = await getAccAndChartAsync(game, msg);

	if (parameters.args.length == 0){
		const embedb = new EmbedBuilder()
			.setTitle("🖨️ - Computed Rating ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(`I cannot compute rating with given parameters. Be sure to add suffix \`%\` for accuracy.`);

		msg.reply({ embeds: [embedb], allowedMentions: { repliedUser: false }});
		return;
	}

	if (parameters.lvl < 1 || parameters.accuracy <= 0){
		const invalidDescription = `I cannot compute rating with given parameters. Be sure to add suffix \`%\` for accuracy.${parameters.invalidDescription}`;
		const embeda = new EmbedBuilder()
			.setTitle("🖨️ - Computed Rating ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(invalidDescription);

		msg.reply({ embeds: [embeda], allowedMentions: { repliedUser: false }});
		return;
	}

	let msgTitle = "🖨️ - Computed Rating";
	let stats = getRatingStats(parameters.accuracy, parameters.lvl);
	let description = ``;
	if (parameters.chart != null){
		let tags = getTagSuffix(parameters.chart.tags, true);
		let chart_description = getChartDescription(parameters.chart, false, true);
		description = `Achieving \`${parameters.accuracy.toFixed(2)}%\` on this song is equivalent to \`${stats.rankColor.label}\` status!\n- ${chart_description}\n- Difficulty: \`${parameters.chart.difficulty_ref.label} ${parameters.lvl}${parameters.chart.dx_ref.short_label}\`\n- ${stats.description}`;
	} else {
		description = `Achieving \`${parameters.accuracy.toFixed(2)}%\` on \`${parameters.lvl.toFixed(1)}\` difficulty will earn you \`${stats.rankColor.label}\` status!\n- ${stats.description}`;
	}

	let embed = new EmbedBuilder()
		.setTitle(msgTitle)
		.setColor(stats.rankColor.color)
		.setDescription(description);

	if (parameters.chart != null) {
		const attachment = new AttachmentBuilder(`${Constants.ImageDirectory}${parameters.chart.image_file}`);
		embed.setThumbnail(`attachment://${parameters.chart.image_file}`);
		msg.reply({ embeds: [embed], files: [attachment], allowedMentions: { repliedUser: false }});
	} else {
		msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
	}
}

module.exports = cmdCalc;
