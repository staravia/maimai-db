const getIsDeveloper = require("./getIsDeveloper.js");

function getIsAdmin(msg){
	try {
		var isDeveloper = getIsDeveloper(msg);
		if (isDeveloper){
			return true;
		}

		var admin = msg.member.permissionsIn(msg.channel).has("ADMINISTRATOR");
		return admin;
	}
	catch {
		return false;
	}
}

module.exports = getIsAdmin;
