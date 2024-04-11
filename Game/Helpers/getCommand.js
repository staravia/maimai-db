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

  return result;
}

module.exports = getCommand;
