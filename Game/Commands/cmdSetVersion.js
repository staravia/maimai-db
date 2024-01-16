const getIsAdmin = require("./../Helpers/getIsAdmin.js");
const getTags = require("./../Helpers/getTags.js");
const { GameVersion, Commands, Constants, ParameterType } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdSetVersion(game, msg){
	var admin = getIsAdmin(msg);
	if (!admin) {
		msg.reply({content: `You are not an admin. Only admins may set version.`, allowedMentions: {repliedUser: false}});
		return;
	}

	let str = msg.content.substring(Constants.Prefix.length + 1 + Commands.SETVERSION.prefix.length).toLowerCase();
	let parameters = getTags(str, GameVersion, ParameterType.VERSION);

	try {
		if (parameters != null && parameters.length > 0){
			const parameter = parameters[0];
			const game_version = parameter.value.id;

			if (game_version < GameVersion.UNIVERSE.id){
				msg.reply({content: `Failed to update default version. The version has to be \`${GameVersion.UNIVERSE.label}\` or greater.\n- Version selected: \`${parameter.value.label}\``, allowedMentions: {repliedUser: false}});
				return;
			}

			game.db.serialize(() => {
				game.db.run('UPDATE guilds SET game_version = ? WHERE id = ?', [game_version, game.id], function (err) {
					if (err) {
						msg.reply({content: `Failed to update db. \`${err.message}\``, allowedMentions: {repliedUser: false}});
						return console.error(err.message);
					}
					game.game_version = game_version;
					msg.reply({content: `You have changed the server's default version to: \`${parameter.value.label}\``, allowedMentions: {repliedUser: false}});
				});
			});
		}
	} catch (exception){
		msg.reply({content: `Error: \`${exception.message}\``, allowedMentions: {repliedUser: false}});
	}
}

module.exports = cmdSetVersion;
