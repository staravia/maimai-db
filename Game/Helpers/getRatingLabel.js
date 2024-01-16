const { Ranks } = require("./../constants.js");

function getRatingLabel(ranking){
	let rankColor = Ranks.UNRANKED;
	Object.values(Ranks).forEach(rank => {
		if (ranking >= rank.requirement){
			rankColor = rank;
		}
	});
	return {label: `\`${Math.floor(ranking)} ${rankColor.suffix}\``, rankColor: rankColor};
}

module.exports = getRatingLabel;
