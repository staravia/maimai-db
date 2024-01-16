const { DxVersion, Difficulties, GameVersion, Constants } = require("./../constants.js");

function getSanitizedChart(chart, args, invalidate_lvl = false){
	if (chart == null){
		return null;
	}

	Object.values(Difficulties).forEach(difficulty => {
		if (difficulty.id == chart.difficulty){
			chart.difficulty_ref = difficulty;
		}
	});

	Object.values(DxVersion).forEach(dx => {
		if (dx.id == chart.dx_version){
			chart.dx_ref = dx;
		}
	});

	Object.values(Difficulties).forEach(difficulty => {
		if (difficulty.id == chart.difficulty){
			chart.difficulty_ref = difficulty;
		}
	});

	// TODO: make more elegant
	chart.lvl = -1;
	switch (args.diff_version) {
		case GameVersion.FESTIVALPLUS.id:
			chart.lvl = chart.const_fesp;
			if (!invalidate_lvl && chart.lvl == 0){
				chart.lvl = chart.const_bud;
			}
			break;
		case GameVersion.FESTIVAL.id:
			chart.lvl = chart.const_fes;
			if (!invalidate_lvl && chart.lvl == 0){
				chart.lvl = chart.const_fesp;
			} if (!invalidate_lvl && chart.lvl == 0){
				chart.lvl = chart.const_bud;
			}
			break;
		case GameVersion.UNIVERSEPLUS.id:
			chart.lvl = chart.const_unip;
			if (!invalidate_lvl && chart.lvl == 0){
				chart.lvl = chart.const_fes;
			} if (!invalidate_lvl && chart.lvl == 0){
				chart.lvl = chart.const_fesp;
			} if (!invalidate_lvl && chart.lvl == 0){
				chart.lvl = chart.const_bud;
			}
			break;
		case GameVersion.UNIVERSE.id:
			chart.lvl = chart.const_uni;
			if (!invalidate_lvl && chart.lvl == 0){
				chart.lvl = chart.const_unip;
			} if (!invalidate_lvl && chart.lvl == 0){
				chart.lvl = chart.const_fes;
			} if (!invalidate_lvl && chart.lvl == 0){
				chart.lvl = chart.const_fesp;
			} if (!invalidate_lvl && chart.lvl == 0){
				chart.lvl = chart.const_bud;
			}
			break;
		default:
			chart.lvl = chart.const_bud;
			break;
	}

	chart.dir = `./${Constants.ImageDirectory}${chart.image_file}`;
	return chart;
}

module.exports = getSanitizedChart;
