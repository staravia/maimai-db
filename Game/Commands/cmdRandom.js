const handleSearchArguments = require("./../Helpers/handleSearchArguments.js");
const getSearchInformation = require("./../Helpers/getSearchInformation.js");
const getChartRendererAsync = require("./../Helpers/getChartRendererAsync.js");
const getAllChartsAsync = require("./../Helpers/getAllChartsAsync.js");
const { Commands, Constants } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdRandom(game, msg, cache = null)
{
	const db = game.db;
	var isRetry = cache != null;

	if (isRetry){
		cache.retrycount++;
	}

	cache = handleSearchArguments(game, msg.content, cache, msg);
	if (cache.selectcount < 1){
		cache.selectcount = 1;
	}

	// Handle search
	if (cache.search == null){
		cache.search = await getRandomCharts(game, msg, cache);
	} else {
		cache.search = await getRandomChartsFromSearch(cache.search, cache);
	}

	if (cache.search == null || cache.search.selected == null || cache.search.selected.length == 0){
		msg.reply({content: `No charts found${cache.search_description}`, allowedMentions: { repliedUser: false }});
		return;
	}

	var selected = cache.search.selected;
	var info = getSearchInformation(cache);

	// Create a buffer from the canvas and send it as an attachment
	let renderer = await getChartRendererAsync(selected);
	var image = await renderer.toBuffer();
	var attachment = new AttachmentBuilder(image, {name: 'maimai-db-render.png'});
	var msgcolor = selected.length == 1 ? 0x333333 : 0x484848;
	var msgTitle = `🎮 - ${selected.length == 1 ? 'Random Chart' : 'Random Set'}`;

	if (selected.length != cache.selectcount){
		msgTitle += ` ⚠️ ${selected.length}/${cache.selectcount} selected available`;
	} if (cache.retrycount > 0){
		msgTitle += ` 🎲 ${cache.retrycount} reroll${cache.retrycount < 2 ? '' : 's'}`;
	}

	// Send the embedded message with the merged image as an attachment
	const embed = new EmbedBuilder()
		.setTitle(msgTitle)
		.setColor(msgcolor)
		.setDescription(info.description)
		.setImage('attachment://maimai-db-render.png')
		.setFooter({text: Constants.FooterMessage});

	const btnReroll = new ButtonBuilder()
		.setCustomId('reroll')
		.setLabel('Reroll')
		.setEmoji('🎲')
		.setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder()
		.addComponents(btnReroll);

	if (isRetry){
		msg.edit({embeds: [embed], files: [attachment], components: [row], allowedMentions: { repliedUser: false }});
	} else {
		msg.reply({ embeds: [embed], files: [attachment], components: [row], allowedMentions: { repliedUser: false }});
	}
}

async function getRandomCharts(game, msg, args)
{
	let search = null;
	try {
		search = await getAllChartsAsync(game, msg, args);
	} catch (err) {
		search = null;
	}
	return getRandomChartsFromSearch(search, args);
}

function getRandomChartsFromSearch(search, args){
	var selected = [];

	if (search == null || search.results == null){
		return search;
	}

	var results = search.results.slice();
	while (selected.length < args.selectcount && results.length > 0 ){
		var rng = Math.floor(Math.random() * results.length);
		selected.push(results.splice(rng,1)[0]);
	}

	search.selected = selected;
	return search;
}

module.exports = cmdRandom;
