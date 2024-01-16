const { Constants, Commands } = require("./../constants.js");
const getIsDeveloper = require("./../Helpers/getIsDeveloper.js");

async function cmdSetDebug(game, msg){
	var dev = getIsDeveloper(msg);
	if (!dev) {
		msg.reply({content: `You are not a developer. Only developers may toggle debug mode.`, allowedMentions: {repliedUser: false}});
		return;
	}

	let str = msg.content.substring(Constants.Prefix.length + 1 + Commands.SETDEBUG.prefix.length).toLowerCase();
	if (str.indexOf('true') >= 0){
		msg.reply('Debugging enabled.');
		game.debug = true;
	} else if (str.indexOf('false') >= 0){
		msg.reply('Debugging disabled.');
		game.debug = false;
	}
}

module.exports = cmdSetDebug;
