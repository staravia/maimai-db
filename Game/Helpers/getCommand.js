const { Commands, Constants } = require("./../constants.js");

function getCommand(str){
	str = str.substring(Constants.Prefix.length).toLowerCase();
	let result = null;
	Object.values(Commands).forEach(command => {
		if (result == null){
			if (str.substring(0, command.prefix.length) == command.prefix){
				result = command;
			}
		}
	});

	// This is temp.
	if (str == "mythos"){
		return Commands.LEADERBOARD;
	}

  return result;
}

module.exports = getCommand;
