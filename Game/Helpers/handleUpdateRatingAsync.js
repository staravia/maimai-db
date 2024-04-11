const handleDbLogReply = require("./handleDbLogReply.js");
const getDbLogString = require("./getDbLogString.js");
const getRatingLabel = require("./getRatingLabel.js");
const { GameVersion, Constants } = require("./../constants.js");

async function handleUpdateRatingAsync(msg, game, user_id, game_version = null){
	const max_score_count = 40;
	let rating_search = undefined;
	let version_label = undefined;

	if (game_version != null && game_version.id >= GameVersion.UNIVERSE.id){
		rating_search = game_version.rating_label;
		version_label = `(${game_version.label})`
	} else {
		Object.values(GameVersion).forEach(version => {
			if (game.game_version == version.id){
				rating_search = version.rating_label;
				version_label = `(${version.label} - Server default)`;
			}
		});
	}

	let query = `SELECT * FROM scores JOIN charts ON scores.chart_hash = charts.hash WHERE scores.user_id = ? ORDER BY ${rating_search} DESC`
	let params = [user_id];
	let queryLog = getDbLogString(query, params, "USER_SYNC");

	let scores = await new Promise((resolve, reject) => {
		game.db.all(query, params, (e, scores) => {
			if (e) {
				console.log("[CMD_SYNC]: Failed to load scores for guild.");
				reject(e);
			} else {
				resolve(scores);
			}
		});
	});

	if (scores == null){
		scores = [];
	}

	let ratingStat = {};
	let check = [
		`${GameVersion.UNIVERSE.id}`,
		`${GameVersion.UNIVERSEPLUS.id}`,
		`${GameVersion.FESTIVAL.id}`,
		`${GameVersion.FESTIVALPLUS.id}`,
		`${GameVersion.BUDDIES.id}`,
		`${GameVersion.BUDDIESPLUS.id}`
	];

	ratingStat[`${GameVersion.UNIVERSE.id}`] = {rating: 0, version_cur_count: 0, version_prev_count: 0, done: false, game_version: GameVersion.UNIVERSE.id};
	ratingStat[`${GameVersion.UNIVERSEPLUS.id}`] = {rating: 0, version_cur_count: 0, version_prev_count: 0, done: false, game_version: GameVersion.UNIVERSEPLUS.id};
	ratingStat[`${GameVersion.FESTIVAL.id}`] = {rating: 0, version_cur_count: 0, version_prev_count: 0, done: false, game_version: GameVersion.FESTIVAL.id};
	ratingStat[`${GameVersion.FESTIVALPLUS.id}`] = {rating: 0, version_cur_count: 0, version_prev_count: 0, done: false, game_version: GameVersion.FESTIVALPLUS.id};
	ratingStat[`${GameVersion.BUDDIES.id}`] = {rating: 0, version_cur_count: 0, version_prev_count: 0, done: false, game_version: GameVersion.BUDDIES.id};
	ratingStat[`${GameVersion.BUDDIESPLUS.id}`] = {rating: 0, version_cur_count: 0, version_prev_count: 0, done: false, game_version: GameVersion.BUDDIESPLUS.id};

	let scores_submitted = scores.length;
	let count = 0;
	for (let i = 0; i < scores.length; i++) {
		let score = scores[i];

		if (score.game_version >= GameVersion.UNIVERSE.id && ratingStat[`${score.game_version}`].done){
			continue;
		}

		for (var j = 0; j < check.length; j++)
		{
			var id = `${check[j]}`;
			let rating = 0;
			switch (ratingStat[id].game_version) {
				case GameVersion.UNIVERSE.id:
					rating = score.rating_uni;
					break;
				case GameVersion.UNIVERSEPLUS.id:
					rating = score.rating_unip;
					break;
				case GameVersion.FESTIVAL.id:
					rating = score.rating_fes;
					break;
				case GameVersion.FESTIVALPLUS.id:
					rating = score.rating_fesp;
					break;
				case GameVersion.BUDDIES.id:
					rating = score.rating_bud;
					break;
				case GameVersion.BUDDIESPLUS.id:
					rating = score.rating_budp;
					break;
				default:
					break;
			}

			rating = Math.floor(rating);
			if (rating < 1){
				continue;
			}

			let ver = `${score.game_version}`;
			if (ver == id){
				if (ratingStat[ver].version_cur_count < 15 && rating > 0){
					ratingStat[ver].version_cur_count++;
					ratingStat[ver].rating += rating;
				}
				if (ratingStat[ver].version_cur_count == 15 && ratingStat[ver].version_prev_count == 35){
					ratingStat[ver].done = true;
				}
			} else {
				if (ratingStat[id].version_prev_count < 35 && rating > 0){
					ratingStat[id].version_prev_count++;
					ratingStat[id].rating += rating;
				}
				if (ratingStat[id].version_cur_count == 15 && ratingStat[id].version_prev_count == 35){
					ratingStat[id].done = true;
				}
			}
		}

		if (ratingStat[`${GameVersion.UNIVERSE.id}`].done && ratingStat[`${GameVersion.UNIVERSEPLUS.id}`].done && ratingStat[`${GameVersion.FESTIVAL.id}`].done && ratingStat[`${GameVersion.FESTIVALPLUS.id}`].done && ratingStat[`${GameVersion.BUDDIES.id}`].done && ratingStat[`${GameVersion.BUDDIESPLUS.id}`].done){
			break;
		}
	}

	rating_cur = ratingStat[game.game_version].rating;
	let ratingLabel = getRatingLabel(rating_cur);
	let description = `Your db Rating (Top 35+15): ${ratingLabel.label}`;
	query = `INSERT INTO users
		(id, scores_submitted, rating_uni, rating_unip, rating_fes, rating_fesp, rating_bud, rating_budp, count_uni, count_unip, count_fes, count_fesp, count_bud, count_budp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET scores_submitted = ?, rating_uni = ?, rating_unip = ?, rating_fes = ?, rating_fesp = ?, rating_bud = ?, rating_budp = ?, count_uni = ?, count_unip = ?, count_fes = ?, count_fesp = ?, count_bud = ?, count_budp = ?`;

	params = [user_id, scores_submitted, ratingStat[GameVersion.UNIVERSE.id].rating, ratingStat[GameVersion.UNIVERSEPLUS.id].rating, ratingStat[GameVersion.FESTIVAL.id].rating, ratingStat[GameVersion.FESTIVALPLUS.id].rating,
	ratingStat[GameVersion.BUDDIES.id].rating, ratingStat[GameVersion.BUDDIESPLUS.id].rating,

	ratingStat[GameVersion.UNIVERSE.id].version_cur_count, ratingStat[GameVersion.UNIVERSEPLUS.id].version_cur_count, ratingStat[GameVersion.FESTIVAL.id].version_cur_count, ratingStat[GameVersion.FESTIVALPLUS.id].version_cur_count,
	ratingStat[GameVersion.BUDDIES.id].version_cur_count, ratingStat[GameVersion.BUDDIESPLUS.id].version_cur_count,

	scores_submitted,	ratingStat[GameVersion.UNIVERSE.id].rating, ratingStat[GameVersion.UNIVERSEPLUS.id].rating, ratingStat[GameVersion.FESTIVAL.id].rating, ratingStat[GameVersion.FESTIVALPLUS.id].rating, ratingStat[GameVersion.BUDDIES.id].rating, ratingStat[GameVersion.BUDDIESPLUS.id].rating,

	ratingStat[GameVersion.UNIVERSE.id].version_cur_count, ratingStat[GameVersion.UNIVERSEPLUS.id].version_cur_count, ratingStat[GameVersion.FESTIVAL.id].version_cur_count, ratingStat[GameVersion.FESTIVALPLUS.id].version_cur_count,
	ratingStat[GameVersion.BUDDIES.id].version_cur_count, ratingStat[GameVersion.BUDDIESPLUS.id].version_cur_count

];
	queryLog += getDbLogString(query, params, "USER_SYNC");

	await new Promise((resolve, reject) => {
	  game.db.serialize(() => {
			game.db.run(query, params, function(e) {
				if (e) {
					console.error(`[USER_SYNC]: Failed to update user: user_id = ${user_id}} - ${e.message}`, e);
					reject();
				}

				resolve();
			});
		});
	});

	let results = { rating: rating_cur, description: description };
	handleDbLogReply(queryLog, msg, game);

	return results;
}

module.exports = handleUpdateRatingAsync;
