const getAccAndChartAsync = require("./../Helpers/getAccAndChartAsync.js");
const getChartDescription = require("./../Helpers/getChartDescription.js");
const { Constants } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdImage(game, msg){
	let parameters = await getAccAndChartAsync(game, msg);

	if (parameters.args.length == 0 || parameters.chart == null){
		const embedb = new EmbedBuilder()
			.setTitle("📸 - Grab Image ⚠️")
			.setColor(0xCC3333)
			.setDescription(`I cannot find a chart with the given parameters.`);

		msg.reply({ embeds: [embedb], allowedMentions: { repliedUser: false }});
		return;
	}

	let chart_description = getChartDescription(parameters.chart, false, true);

	let embed = new EmbedBuilder()
		.setTitle(`📸 - Grab Image`)
		.setColor(0x000000)
		.setDescription(`- ${chart_description}\nHere's your image! All jackets are \`190x190 px\`.`);

	const attachment = new AttachmentBuilder(`${Constants.ImageDirectory}${parameters.chart.image_file}`);
	embed.setImage(`attachment://${parameters.chart.image_file}`);
	msg.reply({ embeds: [embed], files: [attachment], allowedMentions: { repliedUser: false }});
}

module.exports = cmdImage;
