const { Prefix, DxVersion } = require("./../constants.js");
const getTagSuffix = require("./getTagSuffix.js");
const StringPixelWidth = require("string-pixel-width");

function getChartDescription(chart, short = false, notags = false, tagsOnLeft = false){
	let locked = chart.is_locked ? `🔒 ` : ``;
	let utage = chart.dx_ref.id == DxVersion.UTAGE.id ? `❓` : ``;
	let description = `**${locked}${utage}${chart.title}** - ${chart.artist}`;
	if (short){
		return description;
	}

	let tags = ``;
	if (!notags){
		tags = getTagSuffix(chart.tags, !tagsOnLeft);
	}

	let lvl = ``;
	if (chart.dx_ref.id != DxVersion.UTAGE.id){
		lvl = `${chart.difficulty_ref.label} ${chart.lvl}`;
	} else {
		if (chart.lvl <= 1){
			lvl = `${chart.difficulty_ref.label}❓`;
		} else {
			let isPlus = !((`${chart.lvl.toFixed(1)}`).endsWith('0'));
			lvl = `${chart.difficulty_ref.label} ${Math.floor(chart.lvl)}`;
			if (isPlus){
				lvl += "+";
			}
			lvl += "?"
		}
	}

	description = truncateStringWithEllipsis(description);
	if (tagsOnLeft){
		description = `${tags}${description} **${lvl}${chart.dx_ref.short_label}**`;
	} else {
		description = `${description} **${lvl}${chart.dx_ref.short_label}**${tags}`;
	}
	return description;
}

function truncateStringWithEllipsis(str, maxWidth = 800) {
  const ellipsis = "...";
  const fontSize = 36; // Adjust the font size as needed

  const textWidth = StringPixelWidth(str, { size: fontSize });
  if (textWidth <= maxWidth) {
    return str; // No need to truncate, return the original string
  }

  let truncatedStr = str;
  while (StringPixelWidth(truncatedStr, { size: fontSize }) > maxWidth - StringPixelWidth(ellipsis, { size: fontSize })) {
    truncatedStr = truncatedStr.slice(0, -1);
  }

  return truncatedStr + ellipsis;
}

module.exports = getChartDescription;
