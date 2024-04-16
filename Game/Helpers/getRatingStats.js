const getGrade = require("./getGrade.js");
const getRatingLabel = require("./getRatingLabel.js");

function getRatingStats(acc, lvl){
	let grade = getGrade(acc);
	let multiplier = grade.multiplier;
	let rating = Math.min(1.005, acc / 100) * lvl * multiplier;
	let ranking = Math.floor(rating * 50);
	let rankLabel = getRatingLabel(ranking);
	let description = `Score: \`${Math.floor(rating)}\`  Rating: ${rankLabel.label}`;
	let description_b = `Acc: \`${acc.toFixed(2)}%\`  Rating: ${rankLabel.label}`;
	let result = {
		rating: rating,
		ranking: ranking,
		rankColor: rankLabel.rankColor,
		description: description,
		description_b: description_b
	}

	return result;
}

module.exports = getRatingStats;
