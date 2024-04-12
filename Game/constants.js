module.exports.Constants = {
	DeveloperId: ["148332220120039424", "242102347390517248"],
	Prefix: "a!",
	ImageDirectory: "img/cover/",
	FooterMessage: "🦧power - 🐬tech - 🦑intelligence - 🐯stamina - 🐉trills - 🦝spins",
	DefaultPageSize: 20,
	DefaultSmallPageSize: 10
}

module.exports.BookingType = {
	NONE: {id: 0, label: "None", search_titles: ["none"], prefix: ""},
	RELOCATION: {id: 1, label: "Relocation", search_titles: ["relocation"], prefix: "🗺️"},
	PRIVATE: {id: 2, label: "Private", search_titles: ["private"], prefix: "🔒"},
	OPEN: {id: 3, label: "Open House", search_titles: ["open", "free"], prefix: "✅"},
	EVENT: {id: 4, label: "Event", search_titles: ["event", "special"], prefix: "🎉"},
	CLOSED: {id: 5, label: "Closed", search_titles: ["close", "closed"], prefix: "⛔"},
	CANCELLED: {id: 6, label: "Cancelled", search_titles: ["cancel", "cancelled", "stop"], prefix: "❌"},
}

module.exports.MembershipStatus = {
	NONE: {id: 0, label: "None", search_title: "none", suffix: '▪️'},
	BASIC: {id: 2 ** 0, label: "Basic", search_title: "basic", suffix: '⭐'},
	PRIORITY: {id: 2 ** 1, label: "Priority", search_title: "priority", suffix: '🌟'},
	BANNED: {id: 2 ** 2, label: "Banned", search_title: "banned", suffix: '🤬'}
}

module.exports.Months = {
	JANURARY: { id: 0, label: "Jan", search_titles: ["jan", "janurary"]},
	FEBRUARY: { id: 1, label: "Feb", search_titles: ["feb", "february"]},
	MARCH: { id: 2, label: "Mar", search_titles: ["mar", "march"]},
	APRIL: { id: 3, label: "Apr", search_titles: ["apr", "april"]},
	MAY: { id: 4, label: "May", search_titles: ["may"]},
	JUNE: { id: 5, label: "Jun", search_titles: ["jun", "june"]},
	JULY: { id: 6, label: "Jul", search_titles: ["jul", "july"]},
	AUGUST: { id: 7, label: "Aug", search_titles: ["aug", "august"]},
	SEPTEMBER: { id: 8, label: "Sep", search_titles: ["sep", "sept", "september"]},
	OCTOBER: { id: 9, label: "Oct", search_titles: ["oct", "october"]},
	NOVEMBER: { id: 10, label: "Nov", search_titles: ["nov", "november", "novem"]},
	DECEMBER	: { id: 11, label: "Dec", search_titles: ["dec", "december", "decem"]},
}

module.exports.Days = {
	SUNDAY: { id: 0, label: "Sunday", search_titles: ["sun", "sunday"], prefix: `🔴`},
	MONDAY: { id: 1, label: "Monday", search_titles: ["mon", "monday"], prefix: `🟠`},
	TUESDAY: { id: 2, label: "Tuesday", search_titles: ["tue", "tues", "tuesday"], prefix: `🟡`},
	WEDNESDAY: { id: 3, label: "Wednesday", search_titles: ["wed", "weds", "wednesday"], prefix: `🟢`},
	THURSDAY: { id: 4, label: "Thursday", search_titles: ["thur", "thurs", "thursday"], prefix: `🔵`},
	FRIDAY: { id: 5, label: "Friday", search_titles: ["fri", "friday"], prefix: `🟣`},
	SATURDAY: { id: 6, label: "Saturday", search_titles: ["sat", "saturday"], prefix: `⚪`},
}

module.exports.Commands = {
	HELP: {prefix: 'help', hidden: false, admin_only: false, log_string: "CMD_HELP", example_args: "", details: "Get information."},
  RANDOM: {prefix: 'random', hidden: false, admin_only: false, log_string: "CMD_RANDOM", example_args: " <args>", details: "Selects random charts."},
	SEARCH: {prefix: 'search', hidden: false, admin_only: false, log_string: "CMD_SEARCH", example_args: " <args>", details: "Searches the database for all charts with specified parameters."},
	CALC: {prefix: 'calc', hidden: false, admin_only: false, log_string: "CMD_CALC", example_args: " <grade/acc> <constant>", details: "Computes the rating recieved from playing a specific difficulty"},
	TOP: {prefix: 'top', hidden: false, admin_only: false, log_string: "CMD_TOP", example_args: " <@users/chart>", details: "Retrieve all the top scores in this server or for a specific user."},
	STATS: {prefix: 'stats', hidden: false, admin_only: false, log_string: "CMD_STATS", example_args: "", details: "Get a leaderboards for all the players in this server, or view a specific user's stats."},
	AMAKAGE: {prefix: 'amakage', hidden: false, admin_only: false, log_string: "CMD_AMAKAGE", example_args: " <search>", details: "Searches up for an amakage video with specified search parameter."},
	ADD: {prefix: 'add', hidden: false, admin_only: false, log_string: "CMD_ADD", example_args: " <chart> <grade/acc>", details: "Manually adds a score into the database"},
	REMOVE: {prefix: 'remove', hidden: false, admin_only: false, log_string: "CMD_REMOVE", example_args: " <chart>", details: "Manually removes a score from the database"},
	IMAGE: {prefix: 'image', hidden: false, admin_only: false, log_string: "CMD_IMG", example_args: " <chart>", details: "Grabs the image/jacket from a chart."},
	SETALIAS: {prefix: 'setalias', hidden: false, admin_only: false, log_string: "CMD_SETALIAS", example_args: " <alias>", details: "Sets your alias (username)."},
	SETVERSION: {prefix: 'setversion', hidden: false, admin_only: true, log_string: "CMD_SETVERSION", example_args: " <version>", details: "**Admin Only**, Sets the default game version for the entire discord server."},
	SETSCORESCHANNEL: {prefix: 'setscoreschannel', hidden: false, admin_only: true, log_string: "CMD_SETSCORESCHANNEL", example_args: " <#channel>", details: "**Admin Only**, Sets the score posting channel for this discord server."},
	SETDBCHANNEL: {prefix: 'setdbchannel', hidden: false, admin_only: true, log_string: "CMD_SETDBCHANNEL", example_args: " <#channel>", details: "**Admin Only**, Sets the db channel for this discord server."},
	SETDEBUG: {prefix: 'setdebug', hidden: true, admin_only: true, log_string: "CMD_DEBUG", example_args: " <bool>", details: "**Developer Only**, Toggles debug mode."},
	SETTAGS: {prefix: 'settags', hidden: true, admin_only: true, log_string: "CMD_SETTAGS", example_args: " <tags>", details: "**Developer Only**, Sets the song's tags"},
	STATUS: {prefix: 'status', hidden: true, admin_only: true, log_string: "CMD_STATUS", example_args: " <@user> <status>", details: "**Developer Only**, Sets a user's kumakult status"},
	CREDITS: {prefix: 'credits', hidden: true, admin_only: true, log_string: "CMD_CREDITS", example_args: " <user> <quantity>", details: "**Developer Only**, gives credits to users."},
	BOOK: {prefix: 'book', hidden: true, admin_only: false, log_string: "CMD_BOOK", example_args: " <time>", details: "**Kumakult Only**, schedules for the cab."},
	MYTHOS: {prefix: 'mythos', hidden: false, admin_only: false, log_string: "CMD_MYTHOS", example_args: "", details: "Displays Mythos Leaderboards"},
};

module.exports.Difficulties = {
  BASIC: { id : 2 ** 0, suffix: '🐢', label : "Basic", color_a: "#93d674", color_b: "#49a61c", name_st: "lev_bas", name_dx: "dx_lev_bas", search_titles: ["basic", "easy"] },
  ADVANCED: { id : 2 ** 1, suffix: '🐱', label : "Advanced", color_a: "#edcb6d", color_b: "#f7b807", name_st: "lev_adv", name_dx: "dx_lev_adv", search_titles: ["advanced", "normal", "adv"] },
  EXPERT: { id : 2 ** 2, suffix: '🦞', label : "Expert", color_a: "#f598a0", color_b: "#f55b68", name_st: "lev_exp", name_dx: "dx_lev_exp", search_titles: ["expert", "hard", "exp"] },
  MASTER: { id : 2 ** 3, suffix: '🐙', label : "Master", color_a: "#cf95fc", color_b: "#a740f5", name_st: "lev_mas", name_dx: "dx_lev_mas", search_titles: ["master", "mas"] },
  REMASTER: { id : 2 ** 4, suffix: '🦄', label : "Re:Master", color_a: "#e3d5ed", color_b: "#ffffff", name_st: "lev_remas", name_dx: "dx_lev_remas", search_titles: ["remaster", "re:master", "remas", "re:mas"] },
	SPECIAL: { id : 2 ** 5, suffix: '⭐', label : "Utage", color_a: "#ba8a8a", color_b: "#eb5b97", name_st: "lev_special", name_dx: "dx_lev_special", search_titles: ["utage"] }
};

module.exports.Regions = {
	INTERNATIONAL: { id: 2 ** 0, label: "International", search_titles: ["intl", "international"]},
	CHINA: { id: 2 ** 1, label: "China", search_titles: ["china", "cn"]}
}

module.exports.Locale = {
	GLOBAL: { id: 2 ** 0, label: "Global (Default)", search_titles: ["global"]},
	LOCAL: { id: 2 ** 1, label: "Local (This server only)", search_titles: ["local", "server"]}
}

module.exports.ParameterType = {
	INVALID: {prefix: 'invalid', format: 'N/A', example: "Invalid Argument."},
	COUNT: {prefix: 'count', format: '<num>x (with an x at the end)', example: "Selects x amount of songs"},
	CONSTANT: {prefix: 'constant', format: '<num> or <num>+ (with a + at the end - optional)', example: "Selects charts by Difficulty Number (example: 14.0, 13+, 12)."},
	DIFFICULTY: {prefix: 'difficulty', format: '<label>', example: "Selects charts by Difficulty Label (basic, adv, exp, mas, remas)."},
	CATEGORY: {prefix: 'category', format: '<label>', example: "Selects charts by Category Folder. (maimai, chuni, anime, variety, touhou, niconico)"},
	DX: {prefix: 'dx-version', format: '<label>', example: "Selects charts by DX version or STD version (dx, st) "},
	VERSION: {prefix: 'game-version', format: '<label>', example: "Selects charts by Version Folder.\n  - Addition: `until` keyword will search until specified version."},
	TAGS: {prefix: 'tags', format: '<label>', example: "Selects charts by maimai-db Tags. (power, tech, gimmick, stamina, slide, trill, spin, basics) \n  - Addition: `only` and `exact` will add conditions when looking up tags."},
	SEARCH: {prefix: 'search', format: '"<text>" (with quotes)', example: "Selects charts by matching string. Supports romaji + maimai-db search labels such as abbreviations."},
	GRADE: {prefix: 'grade', format: '<label>', example: "Selects charts by grade achieved or used in the Calc command (example: sss, ss+, aaa)"},
	PERCENT: {prefix: 'percent', format: '<num>% (with a % at the end)', example: "Adds a percentage grade (example: 99.4%, 100.5%)"},
	USERID: {prefix: 'user', format: '<@user>', example: "Searches for scores/stats achieved by user"},
	REGION: {prefix: 'region', format: '<label>', example: "Selects charts only available from a specific region (china or international)"},
	LOCKEDSTATUS: {prefix: 'locked', format: '<label>', example: "Searches for charts that are either locked or unlocked."},
	LOCALE: {prefix: 'locale', format: '<label>', example: "Determines if scores-lookup should be local to this server or global."},
	ALIAS: {prefix: 'alias', format: '<<alias>>', example: "Will search scores/stats by alias. Example: \`<john>\` will search up john's scores."},
	TIME: {prefix: 'time', format: '<num>am or <num>pm', example: "Used for scheduling stuff."},
	DAY: {prefix: 'day', format: '<name of day>', example: "Used for scheduling stuff."},
	MONTH: {prefix: 'month', format: '<name of month>', example: "Used for scheduling stuff."},
	DURATION: {prefix: 'duration', format: '<num>hr', example: "Used for scheduling stuff."},
	BOOKINGTYPE: {prefix: 'booking', format: '<label>', example: "Used for scheduling stuff."},
};

module.exports.Grades = {
	  F: { label: 'F', color: '#8c8d8f', search_titles: ["f"], requirement: 0, multiplier: 0.0 },
    C: { label: 'C', color: '#8c8d8f', search_titles: ["c"], requirement: 50, multiplier: 10.0 },
    B: { label: 'B', color: '#386cba', search_titles: ["b"], requirement: 60, multiplier: 10.0 },
    BB: { label: 'BB', color: '#386cba', search_titles: ["bb"], requirement: 70, multiplier: 10.0 },
    BBB: { label: 'BBB', color: '#386cba', search_titles: ["bbb"], requirement: 75, multiplier: 10.0 },
    A: { label: 'A', color: '#c4413f', search_titles: ["a"], requirement: 80, multiplier: 13.6 },
    AA: { label: 'AA', color: '#d44e4c', search_titles: ["aa"], requirement: 90, multiplier: 15.2 },
    AAA: { label: 'AAA', color: '#f56b69', search_titles: ["aaa"], requirement: 94, multiplier: 16.8 },
    S: { label: 'S', color: '#fa932d', search_titles: ["s"], requirement: 97, multiplier: 20.0 },
    SP: { label: 'S+', color: '#fa9e2d', search_titles: ["s+"], requirement: 98, multiplier: 20.3 },
    SS: { label: 'SS', color: '#fab328', search_titles: ["ss"], requirement: 99, multiplier: 20.8 },
    SSP: { label: 'SS+', color: '#ffc233', search_titles: ["ss+"], requirement: 99.5, multiplier: 21.1 },
    SSS: { label: 'SSS', color: '#ffde59', search_titles: ["sss"], requirement: 100, multiplier: 21.6 },
    SSSP: { label: 'SSS+', color: '#fff4a8', search_titles: ["sss+"], requirement: 100.5, multiplier: 22.4 },
};

module.exports.Ranks = {
	UNRANKED: { requirement: 0, color: 0x484848, suffix: '▫️', label: 'unranked'},
	BLUE: { requirement: 1000, color: 0x696e80, suffix: '🟦', label: 'blue'},
	GREEN: { requirement: 2000, color: 0x6b8069, suffix: '🟩', label: 'green'},
	YELLOW: { requirement: 4000, color: 0x9a9378, suffix: '🟨', label: 'yellow'},
	RED: { requirement: 7000, color: 0x9a7878, suffix: '🟥', label: 'red'},
	PURPLE: { requirement: 10000, color: 0x81789a, suffix: '🟪', label: 'purple'},
	BRONZE: { requirement: 12000, color: 0x967c61, suffix: '🥉', label: 'bronze'},
	SILVER: { requirement: 13000, color: 0xb7b7b7, suffix: '🥈', label: 'silver'},
	GOLD: { requirement: 14000, color: 0xf1c232, suffix: '🥇', label: 'gold'},
	PLAT: { requirement: 14500, color: 0xffe599, suffix: '💎', label: 'plat'},
	LOWRAINBOW: { requirement: 15000, color: 0x8ff4aa, suffix: '🌈', label: 'rainbow'},
	MIDRAINBOW: { requirement: 15500, color: 0x70d5f2, suffix: '🌈🌈', label: 'mid-rainbow'},
	HIGHRAINBOW: { requirement: 16000, color: 0xbe8cde, suffix: '👺', label: 'high-rainbow'},
	PEAKRAINBOW: { requirement: 16450, color: 0xe28dec, suffix: '👹', label: 'peak-rainbow'}
}

module.exports.DxVersion = {
	ST: { id: 2 ** 0, label: "Standard", short_label: " (std)", search_titles: ["std", "standard"], image_file: './img/inner_st.png'},
	DX: { id: 2 ** 1, label: "Deluxe", short_label: " (DX)", search_titles: ["dx", "deluxe"], image_file: './img/inner_dx.png'},
	UTAGE: { id: 2 ** 2, label: "Utage", short_label: "", search_titles: ["utage"], image_file: './img/inner_utage.png'}
};

module.exports.Tags = {
	NONE: { id : 0, suffix: '▫️', label : "No-tags", search_titles: ["none", "notags"] },
  POWER: { id : 2 ** 0, suffix: '🦧', label : "Power", search_titles: ["power", "earth", "speed", "tapspeed", "pow"] },
  TECH: { id : 2 ** 1, suffix: '🐬', label : "Tech", search_titles: ["technical", "pinoy", "philipines", "filipino", "tech"] },
  INTELLIGENCE: { id : 2 ** 2, suffix: '🦑', label : "Intelligence", search_titles: ["iq", "intelligence", "reading", "gimmicks", "intel"] },
  STAMINA: { id : 2 ** 3, suffix: '🐯', label : "Stamina", search_titles: ["stamina", "stam"] },
  TRILL: { id : 2 ** 4, suffix: '🐉', label : "Trills", search_titles: ["trills", "trill"] },
  SPIN: { id : 2 ** 5, suffix: '🦝', label : "Spins", search_titles: ["spins", "spin"] },
	ANY: { id : 2 ** 29, suffix: '', label : "Any (>=1 matching tag)", search_titles: ["all", "any"] },
	MATCHING: { id : 2 ** 30, suffix: '', label : "Exact (tags have to match)", search_titles: ["matching", "exact", "match"] },
	ONLY: { id : 2 ** 31, suffix: '', label : "Only (>= 1 matching tag and no other tags)", search_titles: ["only"] }
};

module.exports.Categories = {
	ANIME: {id: 2 ** 0, label: "Anime & Pop", image_file: './img/icon-folder-anime.png', search_titles: ["anime", "pop"]},
	MAIMAI: {id: 2 ** 1, label: "Maimai Originals", image_file: './img/icon-folder-maimai.png', search_titles: ["maimai", "originals"]},
	VARIETY: {id: 2 ** 2, label: "Variety", image_file: './img/icon-folder-variety.png', search_titles: ["variety", "other"]},
	CHUGEKI: {id: 2 ** 3, label: "Chunithum & Ongeki", image_file: './img/icon-folder-chugeki.png', search_titles: ["chugeki", "chunithm", "ongeki", "sega", "chuni"]},
	TOHO: {id: 2 ** 4, label: "Touhou Project", image_file: './img/icon-folder-toho.png', search_titles: ["toho", "touhou"]},
	NICONICO: {id: 2 ** 5, label: "Niconico & Vocaloid", image_file: './img/icon-folder-niconico.png', search_titles: ["niconico", "vocaloid", "nico"]},
	UTAGE: {id: 2 ** 6, label: "Utage", image_file: './img/icon-folder-utage.png', search_titles: ["utage"]}
};

module.exports.LockedStatus = {
	LOCKED: {id: 2 ** 0, prefix: '🔒', label: "Locked", search_titles: ["locked", "lock"]},
	UNLOCKED: {id: 2 ** 1, prefiex: '', label: "Unlocked", search_titles: ["unlocked"]}
}

module.exports.GameVersion = {
	MAIMAI: {id: 2 ** 0, json_label: "maimai", label: "maimai (classic)", search_titles: ["maimai", "classic"]},
	MAIMAIPLUS: {id: 2 ** 1, json_label: "maimai PLUS", label: "maimai PLUS", search_titles: ["maimai+", "mai+", "maiplus", "maimaiplus", "classic+", "classicplus"]},
	GREEN: {id: 2 ** 2, json_label: "GreeN", label: "GreeN", search_titles: ["green"]},
	GREENPLUS: {id: 2 ** 3, json_label: "GreeN PLUS", label: "GreeN PLUS", search_titles: ["green+", "greenplus"]},
	ORANGE: {id: 2 ** 4, json_label: "ORANGE", label: "ORANGE", search_titles: ["orange"]},
	ORANGEPLUS: {id: 2 ** 5, json_label: "ORANGE PLUS", label: "ORANGE PLUS", search_titles: ["orange+", "orangeplus"]},
	PINK: {id: 2 ** 6, json_label: "PiNK", label: "PiNK", search_titles: ["pink"]},
	PINKPLUS: {id: 2 ** 7, json_label: "PiNK PLUS", label: "PiNK PLUS", search_titles: ["pink+", "pinkplus"]},
	MURASAKI: {id: 2 ** 8, json_label: "MURASAKi", label: "MURASAKi", search_titles: ["murasaki"]},
	MURASAKIPLUS: {id: 2 ** 9, json_label: "MURASAKi PLUS", label: "MURASAKi PLUS", search_titles: ["murasaki+", "murasakiplus", "mura+", "muraplus"]},
	MILK: {id: 2 ** 10, json_label: "MiLK", label: "MiLK", search_titles: ["milk"]},
	MILKPLUS: {id: 2 ** 11, json_label: "MiLK PLUS", label: "MiLK PLUS", search_titles: ["milk+", "milkplus"]},
	FINALE: {id: 2 ** 12, json_label: "FiNALE", label: "FiNALE", search_titles: ["finale"]},
	DX: {id: 2 ** 13, json_label: "舞萌DX", label: "maimai DX", search_titles: ["maidx"]},
	DXPLUS: {id: 2 ** 14, json_label: "舞萌DX", label: "maimai DX PLUS", search_titles: ["maidxplus", "maidx+"]},
	SPLASH: {id: 2 ** 15, json_label: "舞萌DX 2021", label: "Splash", search_titles: ["splash"]},
	SPLASHPLUS: {id: 2 ** 16, json_label: "舞萌DX 2021", label: "Splash PLUS", search_titles: ["splash+"]},
	UNIVERSE: {id: 2 ** 17, json_label: "舞萌DX 2022", label: "UNiVERSE", search_titles: ["universe", "uni"], const_label: "const_uni", rating_label: "rating_uni"},
	UNIVERSEPLUS: {id: 2 ** 18, json_label: "舞萌DX 2022", label: "UNiVERSE PLUS", search_titles: ["universe+", "universeplus", "uni+", "uniplus"], const_label: "const_unip", rating_label: "rating_unip"},
	FESTIVAL: {id: 2 ** 19, json_label: "舞萌DX 2023", label: "FESTiVAL", search_titles: ["festival", "fes", "fest"], const_label: "const_fes", rating_label: "rating_fes"},
	FESTIVALPLUS: {id: 2 ** 20, json_label: "舞萌DX 2023", label: "FESTiVAL PLUS", search_titles: ["festival+", "festivalplus", "fesp", "fest+", "fes+", "fesplus"], const_label: "const_fesp", rating_label: "rating_fesp"},
	BUDDIES: {id: 2 ** 21, json_label: "舞萌DX 2024", label: "BUDDiES", search_titles: ["buddies", "buds", "bud", "buddy"], const_label: "const_bud", rating_label: "rating_bud"},
	BUDDIESPLUS: {id: 2 ** 22, json_label: "舞萌DX 2024", label: "BUDDiES PLUS", search_titles: ["buddiesplus", "budsplus", "budplus", "buddyplus", "buddies+", "buds+", "bud+", "buddy+"], const_label: "const_budp", rating_label: "rating_budp"},
	UNTIL: {id: 2 ** 31, json_label: "", label: "Until", search_titles: ["until", "upto"] }
};

module.exports.SearchArgs = class SearchArgs {
	constructor(){
		this.command = null;
		this.searchflags = 0;
		this.categories = 0;
		this.difficulties = 0;
		this.tags = 0;
		this.tags_none = false;
		this.invalid = [];
		this.search_description = "";
		this.search_title = "";
		this.lvlmin = 15;
		this.lvlmax = 1;
		this.selectcount = 0;
		this.page = 0;
		this.message = null;
		this.search = null;
		this.retrycount = 0;
		this.optional_tags = [];
		this.tags_only = false;
		this.tags_matching = false;
		this.game_version = 0;
		this.until_version = false;
		this.region = 0;
		this.locked_status = 0;
		this.diff_version = 0;
		this.locale = 0;
	}
}

module.exports.ParameterBuilder = class ParameterBuilder {
	constructor(value, type = ParameterType.INVALID){
		this.type = type;
		this.value = value;
	}
};
