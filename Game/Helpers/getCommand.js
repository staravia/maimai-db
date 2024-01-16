const { Commands, Constants } = require("./../constants.js");

function getCommand(str){
	str = str.substring(Constants.Prefix.length);
	let result = null;
	Object.values(Commands).forEach(command => {
		if (result == null){
			if (str.toLowerCase().substring(0, command.prefix.length) == command.prefix){
				result = command;
			}
		}
	});
  return result;
}

module.exports = getCommand;
