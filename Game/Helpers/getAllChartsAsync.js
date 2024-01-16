const { Commands, Constants, GameVersion, LockedStatus, Regions, Locale } = require("./../constants.js");
const handleDbLogReply = require("./handleDbLogReply.js");
const getDbLogString = require("./getDbLogString.js");

async function getAllChartsAsync(game, msg, args, is_score = false){
	let db = game.db;
	let lvl_name = ``;
	let rating_name = ``;
	switch (args.diff_version) {
		case GameVersion.FESTIVALPLUS.id:
			lvl_name = GameVersion.FESTIVALPLUS.const_label;
			rating_name = GameVersion.FESTIVALPLUS.rating_label;
			break;
		case GameVersion.FESTIVAL.id:
			lvl_name = GameVersion.FESTIVAL.const_label;
			rating_name = GameVersion.FESTIVAL.rating_label;
			break;
		case GameVersion.UNIVERSEPLUS.id:
			lvl_name = GameVersion.UNIVERSEPLUS.const_label;
			rating_name = GameVersion.UNIVERSEPLUS.rating_label;
			break;
		case GameVersion.UNIVERSE.id:
			lvl_name = GameVersion.UNIVERSE.const_label;
			rating_name = GameVersion.UNIVERSE.rating_label;
			break;
		default:
			lvl_name = GameVersion.BUDDIES.const_label;
			rating_name = GameVersion.BUDDIES.rating_label;
			break;
	}

	let members = [];

	if (is_score && args.locale == Locale.LOCAL.id){
		members = (await msg.guild.members.fetch()).map(m => m.user.id);
	}

	return await new Promise((resolve, reject) => {
    let query = ``;

		if (!is_score){
			query = `SELECT * FROM charts WHERE (${lvl_name} >= ? AND ${lvl_name} <= ?) `;
		} else {
			let scores_user_query = ``;
			if (args.users != null && args.users.length > 0){
				scores_user_query = `AND scores.user_id = ${args.users[0]}`;
			}

			query = `SELECT * FROM scores JOIN charts ON scores.chart_hash = charts.hash ${scores_user_query} WHERE (<!>${lvl_name} >= ? AND <!>${lvl_name} <= ? ${scores_user_query}) `;  //${userParams.version.rating_label} DESC`;
		}
		if (args.categories != 0){
			query += `AND ((${args.categories} & <!>category) = <!>category) `;
		}
		if (args.game_version != 0 && args.search_title != undefined && args.search_title.length == 0){
			if (args.until_version) {
				query += `AND (<!>game_version <= ${args.game_version}) `;
			} else {
				query += `AND ((${args.game_version} & <!>game_version) = <!>game_version) `;
			}
		}
		if (args.difficulties != 0){
			query += `AND ((${args.difficulties} & <!>difficulty) = <!>difficulty) `;
		}
		if (args.locked_status == LockedStatus.LOCKED.id){
			query += `AND (<!>is_locked = TRUE) `;
		} else if (args.locked_status == LockedStatus.UNLOCKED.id){
			query += `AND (<!>is_locked = FALSE) `;
		}
		if (args.region == Regions.CHINA.id){
			query += `AND (<!>is_china = TRUE) `;
		} else if (args.region == Regions.INTERNATIONAL.id){
			query += `AND (<!>is_international = TRUE) `;
		}
		if (args.tags != 0 || args.tags_none){
			if (args.tags_matching) {
				query += `AND (${args.tags} = <!>tags)`;
			} else if (args.tags_only) {
				if (args.tags_none){
					query += `AND ((${args.tags} & <!>tags) = <!>tags)`;
				} else {
					query += `AND ((${args.tags} & <!>tags) = <!>tags) AND (<!>tags != 0)`;
				}
			} else {
				var tag_search = "";
				var found = false;
				args.optional_tags.forEach(tag => {
					if (!found){
						if (tag == 0) {
							tag_search += `(<!>tags = 0)`;
						} else {
							tag_search += `((${tag} & <!>tags) > 0)`;
						}
						found = true;
					} else {
						if (tag == 0) {
							tag_search += `OR (<!>tags = 0)`;
						} else {
							tag_search += `OR ((${tag} & <!>tags) > 0)`;
						}
					}
				});
				query += `AND (${tag_search})`;
			}
		}
		if (args.dx_version != 0){
			query += `AND ((${args.dx_version} & <!>dx_version) = <!>dx_version) `;
		}

		if (args.search_title.length > 0){
			query += `AND (`;
				var first = true;
			args.search_title.forEach(search => {
				// const glob = "* " + search.split('').join('*') + "*";
				if (first){
					first = false;
					query += `<!>search_title LIKE '%${search}%' COLLATE NOCASE `;
					// query += `OR search_title GLOB '${glob}' `;
				} else {
					query += `OR <!>search_title LIKE '%${search}%' COLLATE NOCASE `;
					// query += `OR search_title GLOB '${glob}' `;
				}
			});
			query += `) `;
		}

		if (is_score){
			query += ` ORDER BY scores.${rating_name} DESC, scores.accuracy DESC`;
			query = query.replaceAll(`<!>`, `charts.`);
		} else {
				query += ` ORDER BY ${lvl_name} DESC`;
			query = query.replaceAll(`<!>`, ``);
		}

		let params = [args.lvlmin, args.lvlmax];
		let queryLog = getDbLogString(query, params, "CHART_SEARCH");
		handleDbLogReply(queryLog, msg, game);

    db.all(query, params, (e, rows) => {
      if (e) {
        reject(e);
      } else if (rows.length == 0) {
				resolve({selected: null, results: []});
			} else {
				let results = [];
				if (is_score){
					if (args.locale == Locale.LOCAL.id){
						rows.forEach(row => {
							if (members.includes(row.user_id)){
								results.push(row);
							}
						});
					} else {
						results = rows;
					}
				} else {
					results = rows;
					if (args.search_title.length > 0){
						results.forEach(result => {
							result.search_score = computeSearchMatchScore(`${result.title}`, args.search_title);
						})

						results.sort((a, b) => {
					    return b.search_score - a.search_score;
					  });
					}
				}

				resolve({selected: rows, results: results});
      }
    });
  });
}

function computeSearchMatchScore(str, args){
	let result = 0;
	args.forEach(arg => {
		// let score = calculateMatchingRatio(str, arg);
		// if (score > result){
		// 	result = score;
		// }
		result += calculateMatchingRatio(str, arg);
	});

	return result;
}

function calculateMatchingRatio(input, comparison) {
	if (input == null || input == undefined || input == ""){
		return 0;
	}

  const inputLower = input.toLowerCase();
  const comparisonLower = comparison.toLowerCase();

  let matchingCount = 0;
  const inputLength = Math.max(inputLower.length, comparisonLower.length, 1);
  let lastIndex = -1;

  // Iterate through each character in the input
  for (let i = 0; i < inputLength; i++) {
    const char = inputLower[i];
    const index = comparisonLower.indexOf(char, lastIndex + 1);

    if (index > lastIndex) {
      matchingCount++;
      lastIndex = index;
    }
  }

  // Calculate the matching ratio as a percentage
	const lengthFactor = input.length * 40;
  const matchingRatio = (matchingCount / inputLength) * (1000 + lengthFactor);
  return matchingRatio + input.length;
}

module.exports = getAllChartsAsync;
