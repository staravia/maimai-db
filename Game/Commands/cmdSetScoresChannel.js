const getIsAdmin = require("./../Helpers/getIsAdmin.js");
const { Constants, Commands } = require("./../constants.js");

// TODO: CLEAN CODE
async function cmdSetScoresChannel(game, msg){
	var admin = getIsAdmin(msg);
	if (!admin) {
		msg.reply({content: `You are not an admin. Only admins may set the scores channel.`, allowedMentions: {repliedUser: false}});
		return;
	}

	let str = msg.content.substring(Constants.Prefix.length + 1 + Commands.SETSCORESCHANNEL.prefix.length).toLowerCase();
	// let parameters = getTags(str, GameVersion, ParameterType.VERSION);

	if (!str.startsWith('<') || !str.endsWith('>') || str.indexOf('#') != 1){
		msg.reply({content: `Invalid channel. Please use \`${Constants.Prefix}setscoreschannel <#channel>\``, allowedMentions: {repliedUser: false}});
		return;
	}

	str = str.replace('<', '').replace('>', '').replace('#', '');

	let channel = game.discord.channels.cache.get(str);
	let hasPermission = msg.guild.members.me?.permissionsIn(channel).has('117760');
	if (!hasPermission){
		msg.reply({content: `Failed to update the scores channel. I do not have permission to read or write in this channel.`, allowedMentions: {repliedUser: false}});
		return;
	}

	try {
		if (str.length > 8){

			game.db.serialize(() => {
				game.db.run('UPDATE guilds SET scores_channel_id = ? WHERE id = ?', [str, game.id], function (err) {
					if (err) {
						msg.reply({content: `I failed to update the scores channel in my database. \`${err.message}\``, allowedMentions: {repliedUser: false}});
						return console.error(err.message);
					}
					game.scores_channel_id = str;
					msg.reply({content: `You have changed the server's default scores channel to: <#${str}>. I will analyze images in this channel for score-keeping.`, allowedMentions: {repliedUser: false}});
				});
			});
		}
	} catch (exception){
		msg.reply({content: `Error: \`${exception.message}\``, allowedMentions: {repliedUser: false}});
	}
}

module.exports = cmdSetScoresChannel;
