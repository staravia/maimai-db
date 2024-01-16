const handleSetPresence = require("./handleSetPresence.js");
let is_discord_loading = false;

async function getUserAsync(game, user_id){
	try {
		if (game.cache.usernames[user_id] != undefined){
			return game.cache.usernames[user_id];
		}

		let query = `SELECT * FROM users`;
		let users = await new Promise((resolve, reject) => {
			game.db.all(query, (e, results) => {
				if (e) {
					console.log("[CMD_STATS_user]: Failed to fetch user.");
					reject(e);
				} else {
					resolve(results);
				}
			});
		});

		handleSetPresence(game.discord, users.length);

		if (!is_discord_loading){
			is_discord_loading = true;

			for (user of users){
				try {
					if (game.cache.usernames[user.id] == undefined || game.cache.usernames[user.id] == ""){
						if (user.alias == null || user.alias == undefined || user.alias == ""){
							try {
								// TODO: fix so this line does not run in parallel
								let found = await game.discord.users.fetch(user.id);
								game.cache.usernames[user.id] = found.username;
								console.log(found.username);
							} catch {
								game.cache.usernames[user.id] = "-unknown-";
							}
						} else {
							game.cache.usernames[user.id] = user.alias;
						}
					}
				}
				catch {
					// Ignored.
				}
			}

			is_discord_loading = false;
		}

		if (game.cache.usernames[user_id] == undefined){
			try {
				let found = await game.discord.users.fetch(user_id);
				game.cache.usernames[user_id] = found.username;
			} catch {
				game.cache.usernames[user_id] = "-unknown-";
			}
		}

		return game.cache.usernames[user_id];
	} catch (e){
		return "-unknown-";
	}
}

module.exports = getUserAsync;
