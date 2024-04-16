const handleSetPresence = require("./handleSetPresence.js");
let is_discord_loading = false;

function isNumber(value) {
    return (typeof value === 'number' || typeof value === 'string') && !isNaN(value);
}

async function getUserAsync(game, user_id){
	try {

		if (!isNumber(user_id)){
			return user_id;
		}

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
                let found = "-syncing...-"
								// let found = await game.discord.users.fetch(user.id);
								game.cache.usernames[user.id] = found.username;


                // const insert_query = `INSERT INTO users (id, alias) VALUES (?) ON CONFLICT(id) DO UPDATE SET alias = ?`;
                //
                // let params = [user.id, found.username, found.username];
                //
                // let result = await new Promise((resolve, reject) => {
                //   game.db.run(insert_query, params
                //     , function(e) {
                //     if (e) {
                //       console.error(`[SCORE]: FAILED to update user: ${user.id} - ${found.username}`, e);
                //     } else {
                //       resolve(true);
                //     }
                //   });
                // });

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
