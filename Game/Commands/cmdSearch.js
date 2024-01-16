const handleSearchArguments = require("./../Helpers/handleSearchArguments.js");
const handlePageButtons = require("./../Helpers/handlePageButtons.js");
const getAllChartsAsync = require("./../Helpers/getAllChartsAsync.js");
const getChartsByPage = require("./../Helpers/getChartsByPage.js");
const getSearchInformation = require("./../Helpers/getSearchInformation.js");
const getChartRendererAsync = require("./../Helpers/getChartRendererAsync.js");
const { Commands, Constants } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdSearch(game, msg, increment = 0, cache = null){
	const db = game.db;

	var isPageRequest = cache != null;
	cache = handleSearchArguments(game, msg.content, cache, msg);

	if (cache.search == null){
		try {
			cache.search = await getAllChartsAsync(game, msg, cache);
		} catch (err){
			cache.search = null
		}
	}

	if (cache.search == null || cache.search.results == null || cache.search.results.length == 0){
		msg.reply({content: `No charts found${cache.search_description}`, allowedMentions: { repliedUser: false }});
		return;
	}

	let size = Constants.DefaultPageSize;
	if (cache.selectcount > 0){
		size = cache.selectcount;
	}

	let last_page = Math.floor(cache.search.results.length / size);
	if (cache.search.results.length % size == 0 && cache.search.results.length > 0){
		last_page --;
	}

	cache.page += increment;
	cache.page = Math.min(last_page, Math.max(0, cache.page));
	cache.search = getChartsByPage(cache, size);

	var selected = cache.search.selected;
	var info = getSearchInformation(cache, false, false, size);

	// Create a buffer from the canvas and send it as an attachment
	let renderer = await getChartRendererAsync(selected, cache.page);
	var image = await renderer.toBuffer();
	var attachment = new AttachmentBuilder(image, {name: 'maimai-db-render.png'});
	var msgcolor = selected.length == 1 ? 0x333333 : 0x484848;
	var msgTitle = `🔍 - Charts Search 📖 ${cache.page + 1} / ${last_page + 1}`;

	// Send the embedded message with the merged image as an attachment
	const embed = new EmbedBuilder()
		.setTitle(msgTitle)
		.setColor(msgcolor)
		.setDescription(`${info.description}`)
		.setImage('attachment://maimai-db-render.png')
		.setFooter({text: `${Constants.FooterMessage} \nPage ${cache.page + 1} / ${last_page + 1}`});

	let content = { embeds: [embed], files: [attachment], allowedMentions: { repliedUser: false }};
	handlePageButtons(content, cache.page, last_page);

	if (isPageRequest){
		msg.edit(content);
	} else {
		msg.reply(content);
	}
}

module.exports = cmdSearch;
