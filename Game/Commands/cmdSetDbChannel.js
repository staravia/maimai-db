const getIsAdmin = require("./../Helpers/getIsAdmin.js");
const { Constants, Commands } = require("./../constants.js");

// TODO: CLEAN CODE
async function cmdSetDbChannel(game, msg){
	var admin = getIsAdmin(msg);
	if (!admin) {
		msg.reply({content: `You are not an admin. Only admins may set the db channel.`, allowedMentions: {repliedUser: false}});
		return;
	}

	let str = msg.content.substring(Constants.Prefix.length + 1 + Commands.SETDBCHANNEL.prefix.length).toLowerCase();
	// let parameters = getTags(str, GameVersion, ParameterType.VERSION);

	if (!str.startsWith('<') || !str.endsWith('>') || str.indexOf('#') != 1){
		msg.reply({content: `Invalid channel. Please use \`${Constants.Prefix}setdbchannel <#channel>\``, allowedMentions: {repliedUser: false}});
		return;
	}

	str = str.replace('<', '').replace('>', '').replace('#', '');

	let channel = game.discord.channels.cache.get(str);
	let hasPermission = msg.guild.members.me?.permissionsIn(channel).has('117760');
	if (!hasPermission){
		msg.reply({content: `Failed to update the db channel. I do not have permission to read or write in this channel.`, allowedMentions: {repliedUser: false}});
		return;
	}

	try {
		if (str.length > 8){

			game.db.serialize(() => {
				game.db.run('UPDATE guilds SET db_channel_id = ? WHERE id = ?', [str, game.id], function (err) {
					if (err) {
						msg.reply({content: `I failed to update the db channel in my database. \`${err.message}\``, allowedMentions: {repliedUser: false}});
						return console.error(err.message);
					}
					game.db_channel_id = str;
					msg.reply({content: `You have changed the server's default db channel to: <#${str}>. I will listen to \`${Constants.Prefix}\` commands from this channel and analyze images/scores.`, allowedMentions: {repliedUser: false}});
				});
			});
		}
	} catch (exception){
		msg.reply({content: `Error: \`${exception.message}\``, allowedMentions: {repliedUser: false}});
	}
}

module.exports = cmdSetDbChannel;
