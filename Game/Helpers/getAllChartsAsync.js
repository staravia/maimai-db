const { Commands, Constants, GameVersion, LockedStatus, Regions, Locale } = require("./../constants.js");
const handleDbLogReply = require("./handleDbLogReply.js");
const getDbLogString = require("./getDbLogString.js");

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getFullWidthText(text) {
    return text.split('').map(char => {
        const code = char.charCodeAt(0);
        // Convert ASCII characters to full-width
        if (code >= 33 && code <= 126) {
            return String.fromCharCode(code + 65248);
        }
        // Keep non-ASCII characters unchanged
        return char;
    }).join('');
}

async function getAllChartsAsync(game, msg, args, is_score = false){
	let db = game.db;
	let lvl_name = ``;
	let rating_name = ``;
	let where_conditions = ``;
	switch (args.diff_version) {
		case GameVersion.BUDDIES.id:
			lvl_name = GameVersion.BUDDIES.const_label;
			rating_name = GameVersion.BUDDIES.rating_label;
			break;
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
			lvl_name = GameVersion.BUDDIESPLUS.const_label;
			rating_name = GameVersion.BUDDIESPLUS.rating_label;
			break;
	}

	let members = [];

	if (is_score && args.locale == Locale.LOCAL.id){
		members = (await msg.guild.members.fetch()).map(m => m.user.id);
	}

	return await new Promise((resolve, reject) => {
    let query = ``;

		if (!is_score){
			query = `SELECT * FROM charts `;
			where_conditions = `WHERE (${lvl_name} >= ? AND ${lvl_name} <= ?) `;
		} else {
			let scores_user_query = ``;
			if (args.users != null && args.users.length > 0){
				let full_width_name_a = getFullWidthText(args.users[0]);
				let full_width_name_b = getFullWidthText(capitalizeFirstLetter(args.users[0]));
				let full_width_name_c = getFullWidthText(args.users[0].toUpperCase());
				scores_user_query = `AND (user_id LIKE '%${args.users[0]}%' OR user_id LIKE '%${full_width_name_a}%' OR user_id LIKE '%${full_width_name_b}%' OR user_id LIKE '%${full_width_name_c}%')`;
			}

			query = `SELECT scores.id, scores.hash, user_id, chart_hash, accuracy, rating_uni, rating_unip, rating_fes, rating_fesp, rating_bud, rating_budp, message_url, date_unix, charts.* FROM scores JOIN charts ON scores.chart_hash = charts.hash `;  //${userParams.version.rating_label} DESC`;
			where_conditions = `WHERE (${lvl_name} >= ? AND ${lvl_name} <= ? ${scores_user_query}) `;
		}
		if (args.categories != 0){
			where_conditions += `AND ((${args.categories} & category) = category) `;
		}
		if (args.game_version != 0 && args.search_title != undefined && args.search_title.length == 0){
			if (args.until_version) {
				where_conditions += `AND (game_version <= ${args.game_version}) `;
			} else {
				where_conditions += `AND ((${args.game_version} & game_version) = game_version) `;
			}
		}
		if (args.difficulties != 0){
			where_conditions += `AND ((${args.difficulties} & difficulty) = difficulty) `;
		}
		if (args.locked_status == LockedStatus.LOCKED.id){
			where_conditions += `AND (is_locked = TRUE) `;
		} else if (args.locked_status == LockedStatus.UNLOCKED.id){
			where_conditions += `AND (is_locked = FALSE) `;
		}
		if (args.region == Regions.CHINA.id){
			where_conditions += `AND (is_china = TRUE) `;
		} else if (args.region == Regions.INTERNATIONAL.id){
			where_conditions += `AND (is_international = TRUE) `;
		}
		if (args.tags != 0 || args.tags_none){
			if (args.tags_matching) {
				where_conditions += `AND (${args.tags} = tags)`;
			} else if (args.tags_only) {
				if (args.tags_none){
					where_conditions += `AND ((${args.tags} & tags) = tags)`;
				} else {
					where_conditions += `AND ((${args.tags} & tags) = tags) AND (tags != 0)`;
				}
			} else {
				var tag_search = "";
				var found = false;
				args.optional_tags.forEach(tag => {
					if (!found){
						if (tag == 0) {
							tag_search += `(tags = 0)`;
						} else {
							tag_search += `((${tag} & tags) > 0)`;
						}
						found = true;
					} else {
						if (tag == 0) {
							tag_search += `OR (tags = 0)`;
						} else {
							tag_search += `OR ((${tag} & tags) > 0)`;
						}
					}
				});
				where_conditions += `AND (${tag_search})`;
			}
		}
		if (args.dx_version != 0){
			where_conditions += `AND ((${args.dx_version} & dx_version) = dx_version) `;
		}

		if (args.search_title.length > 0){
			where_conditions += `AND (`;
				var first = true;
			args.search_title.forEach(search => {
				// const glob = "* " + search.split('').join('*') + "*";
				if (first){
					first = false;
					where_conditions += `search_title LIKE '%${search}%' COLLATE NOCASE `;
					// where_conditions += `OR search_title GLOB '${glob}' `;
				} else {
					where_conditions += `OR search_title LIKE '%${search}%' COLLATE NOCASE `;
					// where_conditions += `OR search_title GLOB '${glob}' `;
				}
			});
			where_conditions += `) `;
		}

		if (is_score){
			let mythos_query = query;
			mythos_query = mythos_query.replace(`SELECT scores.id, scores.hash, user_id, chart_hash, accuracy, rating_uni, rating_unip, rating_fes, rating_fesp, rating_bud, rating_budp, message_url, date_unix, charts.* FROM scores`, `SELECT scores.id, scores.hash, user_name AS user_id, chart_hash, accuracy, rating_uni, rating_unip, rating_fes, rating_fesp, rating_bud, rating_budp, 'Mythos' AS message_url, date_unix, charts.* FROM mythos_scores scores `);
			query = `WITH full_query AS (${query} UNION ${mythos_query}) SELECT * FROM full_query`;
			query += ` ${where_conditions}`;
			query += ` ORDER BY ${rating_name} DESC, accuracy DESC`;
		} else {
			query += ` ${where_conditions}`;
			query += ` ORDER BY ${lvl_name} DESC`;
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
