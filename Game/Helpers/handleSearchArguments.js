const { Categories, Regions, LockedStatus, Commands, DxVersion, Difficulties, GameVersion, Constants, ParameterType, SearchArgs, Locale, Tags } = require("./../constants.js");
const getSearchArguments = require("./getSearchArguments.js");
const getTagsStringified = require("./getTagsStringified.js");
const getAppendedArgumentsEntry = require("./getAppendedArgumentsEntry.js");
const getCommand = require("./getCommand.js");

function handleSearchArguments(game, query, search = null, msg = null, doNotUpdateCache = false){
	if (search != null){
		return search;
	}

	let result = new SearchArgs();
	let arguments = [];
	arguments = getSearchArguments(query, true);

	let selectcount = 0;
	let searchflags = {};
	let categories = 0;
	let difficulties = 0;
	let tags = 0;
	let optional_tags = [];
	let tags_only = false;
	let tags_none = false;
	let tags_matching = false;
	let locale = Locale.GLOBAL.id;
	let invalid = "";
	let lvlmin = 15;
	let lvlmax = 1;
	let game_version = 0;
	let dx_version = 0;
	let page = 0;
	let until_version = false;
	let region = 0;
	let locked_status = 0;
	let search_title = [];

	Object.values(ParameterType).forEach(param => {
		searchflags[param.prefix] = false;
	});

	arguments.forEach(argument => {
		switch(argument.type){
			case ParameterType.INVALID:
				searchflags[argument.type.prefix] = true;
				invalid = getAppendedArgumentsEntry(argument.value, invalid);
			case ParameterType.CONSTANT:
				searchflags[argument.type.prefix] = true;
				if (argument.value > 0 && argument.value < lvlmin){
					lvlmin = argument.value;
				} else if (argument.value <= 15 && argument.value > lvlmax){
					lvlmax = argument.value;
				}
			break;
			case ParameterType.COUNT:
				searchflags[argument.type.prefix] = true;
				if (argument.value > 0){
					selectcount = Math.max(1, Math.min(argument.value, 20));
				}
			break;
			case ParameterType.CATEGORY:
				searchflags[argument.type.prefix] = true;
				categories |= argument.value.id;
			break;
			case ParameterType.VERSION:
				if (argument.value.id == GameVersion.UNTIL.id){
					until_version = true;
				} else {
					searchflags[argument.type.prefix] = true;
					game_version |= argument.value.id;
				}
			break;
			case ParameterType.DIFFICULTY:
				searchflags[argument.type.prefix] = true;
				difficulties |= argument.value.id;
			break;
			case ParameterType.TAGS:
				if (argument.value.id == Tags.ONLY.id){
					tags_only = true;
				} else if (argument.value.id == Tags.MATCHING.id) {
					tags_matching = true;
				} else if (argument.value.id != Tags.ANY.id){
					searchflags[argument.type.prefix] = true;
					tags |= argument.value.id;
					optional_tags.push(argument.value.id);

					if (argument.value.id == Tags.NONE.id){
						tags_none = true;
					}
				}
			break;
			case ParameterType.DX:
				searchflags[argument.type.prefix] = true;
				dx_version |= argument.value.id;
			break;
			case ParameterType.LOCKEDSTATUS:
				searchflags[argument.type.prefix] = true;
				locked_status |= argument.value.id;
			break;
			case ParameterType.REGION:
				searchflags[argument.type.prefix] = true;
				region |= argument.value.id;
			break;
			case ParameterType.SEARCH:
				searchflags[argument.type.prefix] = true;
				search_title.push(argument.value);
				break;
			case ParameterType.LOCALE:
				searchflags[argument.type.prefix] = true;
				locale = argument.value.id;
				break;
		}
	});

	var lvlcache = lvlmin;
	lvlmin = Math.min(lvlmin, lvlmax);
	lvlmax = Math.max(lvlcache, lvlmax);
	search_title.sort((a, b) => b.length - a.length);

	// Handle search description
	var search_description = ``;
	const allFlagsDisabled = Object.values(searchflags).every(flag => !flag);

	let diff_version = game.game_version;
	if (game_version >= GameVersion.BUDDIESPLUS.id){
		diff_version = GameVersion.BUDDIESPLUS.id;
	} else if (game_version >= GameVersion.BUDDIES.id){
		diff_version = GameVersion.BUDDIES.id;
	} else if (game_version >= GameVersion.FESTIVALPLUS.id){
		diff_version = GameVersion.FESTIVALPLUS.id;
	} else if (game_version >= GameVersion.FESTIVAL.id){
		diff_version = GameVersion.FESTIVAL.id;
	} else if (game_version >= GameVersion.UNIVERSEPLUS.id){
		diff_version = GameVersion.UNIVERSEPLUS.id;
	} else if (game_version >= GameVersion.UNIVERSE.id){
		diff_version = GameVersion.UNIVERSE.id;
	}

	if (allFlagsDisabled){
		search_description += ` with no parameters.\n`;
	} else {
		search_description += ` with the following parameters:\n`;
		if (searchflags[ParameterType.CONSTANT.prefix] == true){
			if (searchflags[ParameterType.VERSION.prefix] == false){
				search_description += `- Constants: \`${lvlmin.toFixed(1)} (min) - ${lvlmax.toFixed(1)} (max) - From ${getTagsStringified(GameVersion, diff_version)} (Server Default)\`\n`;
			} else {
				search_description += `- Constants: \`${lvlmin.toFixed(1)} (min) - ${lvlmax.toFixed(1)} (max) - From ${getTagsStringified(GameVersion, diff_version)}\`\n`;
			}
		} else {
			if (searchflags[ParameterType.VERSION.prefix] == false) {
				search_description += `- Constants: \`From ${getTagsStringified(GameVersion, diff_version)} (Server Default)\`\n`;
			} else {
				search_description += `- Constants: \`From ${getTagsStringified(GameVersion, diff_version)}\`\n`;
			}
		}

		if (searchflags[ParameterType.DIFFICULTY.prefix] == true){
				search_description += `- Difficulties: \`${getTagsStringified(Difficulties, difficulties)}\`\n`;
		} if (searchflags[ParameterType.VERSION.prefix] == true){
			if (until_version) {
				search_description += `- Version: \`${GameVersion.UNTIL.label} ${getTagsStringified(GameVersion, game_version)}\`\n`;
			} else {
				search_description += `- Version: \`${getTagsStringified(GameVersion, game_version)}\`\n`;
			}
		} if (searchflags[ParameterType.CATEGORY.prefix] == true){
				search_description += `- Categories: \`${getTagsStringified(Categories, categories)}\`\n`;
		} if (searchflags[ParameterType.TAGS.prefix] == true){
			if (tags_matching) {
				search_description += `- Tags: \`${getTagsStringified(Tags, tags, tags_none)} - ${Tags.MATCHING.label}\`\n`;
			} else if (tags_only) {
				search_description += `- Tags: \`${getTagsStringified(Tags, tags, tags_none)} - ${Tags.ONLY.label}\`\n`;
			} else {
				search_description += `- Tags: \`${getTagsStringified(Tags, tags, tags_none)} - ${Tags.ANY.label}\`\n`;
			}
		} if (searchflags[ParameterType.DX.prefix] == true){
				search_description += `- DX Version: \`${getTagsStringified(DxVersion, dx_version)}\`\n`;
		} if (searchflags[ParameterType.LOCKEDSTATUS.prefix] == true){
				search_description += `- Locked Status: \`${getTagsStringified(LockedStatus, locked_status)}\`\n`;
		} if (searchflags[ParameterType.REGION.prefix] == true){
				search_description += `- Region: \`${getTagsStringified(Regions, region)}\`\n`;
		} if (searchflags[ParameterType.SEARCH.prefix] == true){
				search_description += `- Search: \`${search_title.join(', ')}\`\n`;
		} if (searchflags[ParameterType.INVALID.prefix]){
			search_description += `\n⚠️ Invalid entries: \`${invalid}\`\n`;
		}
	}

	let command = getCommand(msg.content);
	if (command == Commands.TOP || command == Commands.STATS){
		search_description += `- Leaderboards: \`${getTagsStringified(Locale, locale)}\`\n`;

	}

	if (game_version == 0){
		search_description += `- Version: \`${getTagsStringified(GameVersion, diff_version)} (Server default)\`\n`;
	}

	result.command = command
	result.searchflags = searchflags;
	result.categories = categories;
	result.difficulties = difficulties;
	result.tags = tags;
	result.invalid = invalid;
	result.search_description = search_description;
	result.lvlmin = lvlmin;
	result.lvlmax = lvlmax;
	result.selectcount = selectcount;
	result.page = page;
	result.message = msg;
	result.search = null;
	result.retrycount = 0;
	result.dx_version = dx_version;
	result.search_title = search_title;
	result.optional_tags = optional_tags;
	result.tags_only = tags_only;
	result.tags_matching = tags_matching;
	result.game_version = game_version;
	result.until_version = until_version;
	result.tags_none = tags_none;
	result.diff_version = diff_version;
	result.region = region;
	result.locked_status = locked_status;
	result.locale = locale;

	if (msg != null && !doNotUpdateCache){
		game.requestsCache[msg.author.id] = result;
	}

	return result;
}

module.exports = handleSearchArguments;
