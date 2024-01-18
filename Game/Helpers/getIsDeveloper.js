const { Constants } = require("./../constants.js");

function getIsDeveloper(msg){
	if (Constants.DeveloperId.includes(msg.member.user.id)){
		return true;
	}
	return false;
}

module.exports = getIsDeveloper;
