const getSearchArguments = require("./../Helpers/getSearchArguments.js");
const getVersionAndUsers = require("./../Helpers/getVersionAndUsers.js");
const getDbLogString = require("./../Helpers/getDbLogString.js");
const getUserAsync = require("./../Helpers/getUserAsync.js");
const handleDbLogReply = require("./../Helpers/handleDbLogReply.js");
const getIsAdmin = require("./../Helpers/getIsAdmin.js");
const { Commands, ParameterType } = require("./../constants.js");
const { EmbedBuilder } = require('discord.js');

async function cmdSetAlias(game, msg){
	let args = getSearchArguments(msg.content);
	let userParams = getVersionAndUsers(game, args);
	let alias = "";

	args.forEach(arg => {
		if (arg.type == ParameterType.SEARCH){
			alias = arg.value;
		}
	});

	const max_length = 12;
	if (alias == null || alias == ""){
		const embeda = new EmbedBuilder()
			.setTitle("🏷️ - Set Alias ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(`Error: Invalid alias.`);

		msg.reply({ embeds: [embeda], allowedMentions: { repliedUser: false }});
		msg.react('❌');
		return;
	}

	if (alias.length > max_length){
		const embeda = new EmbedBuilder()
			.setTitle("🏷️ - Set Alias ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(`Invalid alias: \`${alias}\`. Cannot exceed 12 characters in length.`);

		msg.reply({ embeds: [embeda], allowedMentions: { repliedUser: false }});
		msg.react('❌');
		return;
	}

	let msgTitle = "🏷️ - Set Alias";
	let description = ``;
	let user_id = msg.author.id;
	if (userParams.users.length > 0){
		if (!getIsAdmin(msg) && user_id != userParams.users[0]){
			const invalidDescription = `You do not have permission to set aliases for other players.`;
			const embeda = new EmbedBuilder()
				.setTitle("🏷️ - Set Alias ⚠️") // TODO: CLEAN
				.setColor(0xCC3333)
				.setDescription(invalidDescription);

			msg.reply({ embeds: [embeda], allowedMentions: { repliedUser: false }});
			msg.react('❌');
			return;
		}
		user_id = userParams.users[0];
		let user = await getUserAsync(game, user_id);
		description = `You have set \`${user}'s\` alias to: \`${alias}\`.\n\n`;
	} else {
		description = `You have set your alias to: \`${alias}\`.\n\n`;
	}

	const query = `INSERT INTO users
		(id, alias) VALUES (?, ?)
		ON CONFLICT(id) DO UPDATE SET alias = ?`;

	let params = [user_id, alias, alias];
	let queryLog = getDbLogString(query, params, Commands.SETALIAS.log_string);
	let result = await new Promise((resolve, reject) => {
		game.db.run(query, params
			, function(e) {
			if (e) {
				console.error(`[SCORE]: FAILED to update user alias: ${msg.author} - ${user_id} - ${alias}`, e);
			} else {
				game.cache.usernames[user_id] = alias;
				resolve(true);
			}
		});
	});

	const embed = new EmbedBuilder()
		.setTitle(msgTitle)
		.setDescription(description);

	if (result){
		msg.react('✅');
	} else {
		embed.setDescription(`${description}\n⚠️ Failed to update alias in the database.`);
		msg.react('❌');
	}

	handleDbLogReply(queryLog, msg, game);
	msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
}

module.exports = cmdSetAlias;
