const { Constants } = require("./../constants.js");

function getIsDeveloper(msg){
	if (msg.member.user.id == Constants.DeveloperId){
		return true;
	}
	return false;
}

module.exports = getIsDeveloper;
