const { ParameterType, Locale, GameVersion } = require("./../constants.js");

function getVersionAndUsers(game, args){
	let userIndex = 0;
	let scores_user_query = '';
	let users = [];
	let version_id = game.game_version;
	let version = null;
	let locale = Locale.GLOBAL;

	args.forEach(arg => {
		switch(arg.type){
			case ParameterType.VERSION:
				if (arg.value.id >= GameVersion.UNIVERSE.id){
					version = arg.value;
				}
				break;
			case ParameterType.LOCALE:
				locale = arg.value;
				break;
			case ParameterType.USERID:
				users.push(arg.value);
				if (userIndex == 0){
					scores_user_query = `scores.user_id = ${arg.value}`
				} else {
					scores_user_query = `${scores_user_query} OR scores.user_id = ${arg.value}`
				}
				userIndex++;
			break;
		}
	});

	if (version == null){
		Object.values(GameVersion).forEach(v => {
			if (v.id == version_id){
				version = v;
			}
		})
	}

	return {version: version, version: version, scores_user_query: scores_user_query, users: users, locale: locale}
}

module.exports = getVersionAndUsers;
