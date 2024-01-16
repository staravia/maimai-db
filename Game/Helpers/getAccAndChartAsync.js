const { SearchArgs, Difficulties, Commands, ParameterBuilder, ParameterType } = require("./../constants.js");
const getSearchArguments = require("./getSearchArguments.js");
const getChartAsync = require("./getChartAsync.js");
const getSanitizedChart = require("./getSanitizedChart.js");
const handleDbLogReply = require("./handleDbLogReply.js");
const getAppendedArgumentsEntry = require("./getAppendedArgumentsEntry.js");

async function getAccAndChartAsync(game, msg, args = null, noAcc = false){
	if (args == null){
		args = getSearchArguments(msg.content);
	}

	let acc = 0;
	let invalid = "";
	let lvl = 0;
	let dx = 0;
	let search = [];
	let diffVersion = Difficulties.MASTER;
	let chart = null;

	args.forEach(arg => {
		switch(arg.type){
			case ParameterType.INVALID:
				invalid = getAppendedArgumentsEntry(arg.value, invalid);
			case ParameterType.PERCENT:
				acc = Math.min(101, arg.value);
			break;
			case ParameterType.GRADE:
				acc = Math.min(101, arg.value.requirement);
			break;
			case ParameterType.DX:
				dx = arg.value.id;
			break;
			case ParameterType.SEARCH:
				search.push(arg.value);
			break;
			case ParameterType.DIFFICULTY:
				diffVersion = arg.value;
			break;
			case ParameterType.CONSTANT:
				lvl = arg.value;
		}
	});

	if (search.length > 0){
		chart = await getChartAsync(msg, game, diffVersion, search, 1, 15, dx, true);

		let cache = new SearchArgs();
		cache.command = Commands.ADD;
		cache.game_version = game.game_version;
		cache.diff_version = game.game_version;

		if (chart != null){
			chart = getSanitizedChart(chart, cache);
			lvl = chart.lvl;
		}
	}

	let invalidDescription = ``;
	if (lvl < 1 || acc <= 0){
		if (chart != null){
			invalidDescription = `${invalidDescription}\n- Chart: \`${chart.title} - ${chart.artist} - ${chart.difficulty_ref.label} ${chart.lvl}${chart.dx_ref.short_label}\``;
		} else {
			invalidDescription = `${invalidDescription}\n- Constant: \`${lvl.toFixed(1)}\``
		}
		if (!noAcc){
			invalidDescription = `${invalidDescription}\n- Accuracy: \`${acc.toFixed(2)}%\``
		}
		if (invalid && invalid != ''){
			invalidDescription = `${invalidDescription}\n⚠️ Invalid entries: \`${invalid}\`\n`;
		}
	}

	return {accuracy: acc, lvl: lvl, chart: chart, args: args, invalidDescription: invalidDescription};
}

module.exports = getAccAndChartAsync;
