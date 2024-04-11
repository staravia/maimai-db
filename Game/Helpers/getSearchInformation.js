const getSanitizedChart = require("./getSanitizedChart.js");
const getChartDescription = require("./getChartDescription.js");
const getTagsStringified = require("./getTagsStringified.js");
const { Constants, Categories, GameVersion } = require("./../constants.js");

function getSearchInformation(args, isScores = false, detailedScores = false, size = - 1){
	const search = args.search;
	const results = search.results;
	const selected = search.selected;
	const totalresults = results.length;
	var description = ``;

	if (size <= 0){
		size = Constants.DefaultPageSize;
	}

	if (isScores){
		description = `Selected \`${selected.length} score${selected.length === 1 ? '' : 's'}\` out of ${totalresults} result${totalresults === 1 ? '' : 's'}`;
	} else {
		description = `Selected \`${selected.length} chart${selected.length === 1 ? '' : 's'}\` out of ${totalresults} result${totalresults === 1 ? '' : 's'}`;
	}
	description += args.search_description;
	description += "\n";

	if (!isScores){
		for (const [i, chart] of selected.entries()) {
			let index = args.page * size + i;
			let sanitizedChart = getSanitizedChart(chart, args);
			let chart_description = getChartDescription(sanitizedChart, false, false, true);
			const line = `${index + args.page * size + 1}. ${chart_description}`;
			description += `${index + 1}. ${chart_description}\n`; // Player: \`${score.user.username}\`  ${score.stats.description_b}\n`; // `${description}\n${line}`;
		}
	} else {
		for (var i = 0; i < size; i++){
			let index = args.page * size + i;
			if (index >= args.search.results.length || index < 0){
				break;
			}

			let score = args.search.results[index];
			let chart_description = ` ${getChartDescription(score, false, false, true)}\n`;
			if (detailedScores){
				let url_description = ``;
				if (score.message_url != ""){
					url_description = `  ${score.message_url}`
				}

				description += `${index + 1}.${chart_description}  ${score.stats.description_b}  <t:${score.date_unix}:R>${url_description}\n`;
			} else {
				description += `${index + 1}.${chart_description} Player: \`${score.user}\`  ${score.stats.description_b}\n`;
			}
			// charts.push(score);
		}
	}

	if (selected.length == 1 && !isScores){
		let chart = selected[0];
		description += ` - Taps: \`${chart.count_taps} (${(chart.count_taps/chart.count_total * 100).toFixed(1)}%)\``;
		description += `  Holds: \`${chart.count_holds} (${(chart.count_holds/chart.count_total * 100).toFixed(1)}%)\`\n`;
		description += ` - Slides: \`${chart.count_slides} (${(chart.count_slides/chart.count_total * 100).toFixed(1)}%)\``;
		description += `  Touch: \`${chart.count_touch} (${(chart.count_touch/chart.count_total * 100).toFixed(1)}%)\`\n`;
		description += ` - Breaks: \`${chart.count_break} (${(chart.count_break/chart.count_total * 100).toFixed(1)}%)\`\n`;
		description += ` - Max Combo: \`${chart.count_total}x\``;
		description += `  Common BPM: \`${chart.bpm} bpm\`\n`;
		description += ` - Notes Designer: \`${chart.notes_designer == "" ? " - " : chart.notes_designer}\`\n`;
		description += ` - Category: \`${getTagsStringified(Categories, chart.category)}\`\n`;
		description += ` - Game Version: \`${getTagsStringified(GameVersion, chart.game_version)}\``;

		let buffed_descriptions = [];

		if (chart.const_uni != chart.const_unip){
			let desc = getBuffedDescription("Uni → Uni+", chart.const_uni, chart.const_unip);
			buffed_descriptions.push(desc);
		} if (chart.const_unip != chart.const_fes){
			let desc = getBuffedDescription("Uni+ → Fes", chart.const_unip, chart.const_fes);
			buffed_descriptions.push(desc);
		} if (chart.const_fes != chart.const_fesp){
			let desc = getBuffedDescription("Fes → Fes+", chart.const_fes, chart.const_fesp);
			buffed_descriptions.push(desc);
		} if (chart.const_fesp != chart.const_bud){
			let desc = getBuffedDescription("Fes+ → Bud", chart.const_fesp, chart.const_bud);
			buffed_descriptions.push(desc);
		} if (chart.const_fesp != chart.const_budp){
			let desc = getBuffedDescription("Bud+ → Bud+", chart.const_bud, chart.const_budp);
			buffed_descriptions.push(desc);
		}

		if (buffed_descriptions.length > 0){
				description += `\n - ${buffed_descriptions.join('  ')}`;
		}
	}

	return {description: description};
}

function getBuffedDescription(label, const_a, const_b){
	let result = (const_b - const_a).toFixed(1);
	let higher = const_b > const_a;
	if (higher){
		return `${label}: \`${const_b.toFixed(1)} (+${result}) 🟢\``
	}

	return `${label}: \`${const_b.toFixed(1)} (${result}) 🔴\``
}

module.exports = getSearchInformation;
