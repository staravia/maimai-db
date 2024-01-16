const handlePageButtons = require("./../Helpers/handlePageButtons.js");
const getTagsStringified = require("./../Helpers/getTagsStringified.js");
const { Commands, Constants, ParameterType, GameVersion, SearchArgs } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

function cmdHelp(game, msg, increment = 0, cache = null){
	let last_page = 3;

	if (cache == null){
		cache = new SearchArgs();
		cache.command = Commands.HELP;
		game.requestsCache[msg.author.id] = cache;
	}

	cache.page += increment;
	cache.page = Math.min(last_page, Math.max(0, cache.page));

	let description = '';
	switch (cache.page) {
		case 0:
			description = "### General Commands\n";
			description += "This is a list of all my commands. Take a look at the second and third page for more info."

			Object.values(Commands).forEach(command => {
				if (!command.admin_only && !command.hidden){
					description = `${description}\n1. \`m!${command.prefix}${command.example_args}\` ${command.details}`;
				}
			})

			description += "\n\n";
			description += "### Special Commands\n";
			description += "Only admins and developers may use these commands.";

			Object.values(Commands).forEach(command => {
				if (command.admin_only && !command.hidden){
					description = `${description}\n1. \`m!${command.prefix}${command.example_args}\` ${command.details}`;
				}
			});
			break;
		case 1:
		description = "### Parameters\n";
		description += `This is the list of parameters used in each command. I am very flexible with the inputs, and you may use shortened or lengthened words to specify what you're looking for.\n- For example: you may substitute \`expert\` with \`exp\` when looking up charts.\n- Additionaly, these parameters may be inputted in any order \n`;
		Object.values(ParameterType).forEach(parameter => {
			if (parameter != ParameterType.INVALID){
			description = `${description}\n1. **${parameter.prefix}**: \`${parameter.format}\` ${parameter.example}`;
			}
		});
		break;
		case 2:
		description = `### Examples\n`
		description += `- \`m!search mas rfts 12+ 14 dx\` searches for the dx version of a song with the title "rfts" between 12.7 and 14.6 difficulty.\n`;
		description += `- \`m!random 6x 12+/13+ remas/mas power tech\` selects 6 random songs between 12.7 and 13.9 difficulty. The songs have to be master/re:master and include the tags "power" and "tech".\n`;
		description += `- \`m!calc ss+ 13+\` will calculate theoretical score of 99.50% for 13+ charts\n`;
		description += `- \`m!calc 100.35% 14.4\` will calculate theoretical score of 100.35% on 14.4 difficulty charts\n`;
		description += `- \`m!amakage our wrenally\` will search up for a amakage video with "our wrenally"\n`;
		description += `- \`m!add "bbb" s+\` will do manually add a score of 98.00% on "break break break" for the user. By default, it will select the 'master' difficulty unless specified.\n`;
		description += `- \`m!remove vertex adv\` will manually remove the user's score for the advance difficulty of "vertex".\n`;
		description += `- \`m!stats\` will display all the top players of this discord server.\n`;
		description += `- \`m!stats @user\` will display a specific user's stats.\n`;
		description += `- \`m!top gunjou signal\` will display all the top scores for "genjou signal" in this discord server.\n`;
		description += `- \`m!top @user\` will display all the top scores for a specific user.\n`;
		break;
		case 3:
			description = "### Credits \n";
			description += "Thank you to those that helped created me directly and indirectly.\n";
			description += "- \`wubbo.\` -  main developer. \n";
			description += "- \`Zetaraku\` - indirect help with the maimai database.\n";
			description += "- \`maiLvChiho\` - indirect help with the song constants.\n"
			description += "- \`dbkjake\` - assistance with tags for lv14 - 14+ charts.\n";
			description += "- \`Starrodkirby86\` - assistance with tags for lv12 - lv13+ charts and general information.\n";
			description += "- \`jerrybibo\` - support with maxrating for fes.\n"
			description += "- \`DeadCake\` - support with general information.\n\n"
			description += "### More Information\n"
			description += "Feel free to invite me to your server!\nhttps://www.kumakult.com/maimai-db \n\n";
			description += `- **Scores channel**: <#${game.scores_channel_id}> (the bot will analyze scores in this channel.)\n`;
			description += `- **db channel**: <#${game.db_channel_id}> (the bot will only accept commands from this channel.)\n`;
			description += `- **Server Default Version**: \`${getTagsStringified(GameVersion, game.game_version)}\` (for information display.)\n`;
		break;
	}

	// Send the embedded message with the merged image as an attachment
	const embed = new EmbedBuilder()
		.setTitle(`❓ - Help 📖 ${cache.page + 1} / ${last_page + 1}`)
		.setColor(0xEEEEEE)
		.setDescription(description)
		// .setImage('attachment://maimai-db-render.png')
		.setFooter({text: `${Constants.FooterMessage} \nPage ${cache.page + 1} / ${last_page + 1}`});

	let content = { embeds: [embed], allowedMentions: { repliedUser: false }};
	handlePageButtons(content, cache.page, last_page);

	if (cache.message == null){
		cache.message = msg;
		msg.reply(content);
	} else {
		msg.edit(content);
	}
}

module.exports = cmdHelp;
