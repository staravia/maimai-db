const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

function handlePageButtons(content, cur_page, last_page){
	const btnPrevPage = new ButtonBuilder()
		.setCustomId('page-prev')
		.setEmoji('◀️')
		.setLabel('Prev Page')
		.setStyle(ButtonStyle.Secondary);

	const btnNextPage = new ButtonBuilder()
		.setCustomId('page-next')
		.setEmoji('▶️')
		.setLabel('Next Page')
		.setStyle(ButtonStyle.Secondary);

	const btnFirstPage = new ButtonBuilder()
		.setCustomId('page-first')
		.setEmoji('⏮️')
		.setStyle(ButtonStyle.Secondary);

	const btnLastPage = new ButtonBuilder()
		.setCustomId('page-last')
		.setEmoji('⏭️')
		.setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder();
	if (cur_page > 0){
		row.addComponents(btnFirstPage, btnPrevPage);
		content.components = [row];
	}
	if (cur_page < last_page){
		row.addComponents(btnNextPage, btnLastPage);
		content.components = [row];
	}
}

module.exports = handlePageButtons;
