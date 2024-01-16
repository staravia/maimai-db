const { Prefix, DxVersion, Constants } = require("./../constants.js");
const handleDbLogReply = require("./handleDbLogReply.js");
const getDbLogString = require("./getDbLogString.js");
const handleSearchArguments = require("./handleSearchArguments.js");
const getSanitizedChart = require("./getSanitizedChart.js");
const getAllChartsAsync = require("./getAllChartsAsync.js");

async function getChartAsync(msg, game, diffVersion = null, possible_songs = null, lvlMin = 0, lvlMax = 15, dx_version = 0, doNotUpdateCache = false){
	if (possible_songs.length == 0 || lvlMin == 0 || diffVersion == null){
		return null;
	}

	if (diffVersion == undefined && lvlFoundMin > 0 && possible_songs != null && possible_songs.length > 0){
		return null;
	}

	let search_string = "";
	possible_songs.forEach((item) => {
		search_string += `"${item}" `;
	});

	let dx = "";
	switch (dx_version) {
		case DxVersion.DX.id:
			dx = ` ${DxVersion.DX.label.toLowerCase()}`;
			break;
		case DxVersion.ST.id:
			dx = ` ${DxVersion.ST.label.toLowerCase()}`;
			break;
	}

	let query = `${Constants.Prefix}search ${lvlMin} ${lvlMax} ${diffVersion.label}${dx} ${search_string}`;
	handleDbLogReply(query, msg, game);
	let cache = handleSearchArguments(game, query, null, msg, doNotUpdateCache);

	if (cache != null && cache.search == null){
		// try {
			cache.search = await getAllChartsAsync(game, msg, cache);
		// } catch (err){
		// 	cache.search = null
		// }
	}

	if (cache == null || cache.search == null || cache.search.results == null || cache.search.results.length == 0){
		return null;
	}

	let results = cache.search.results;
	let chart = getSanitizedChart(results[0], cache);

	return chart;
}

module.exports = getChartAsync;
