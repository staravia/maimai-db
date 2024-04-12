const Crypto = require("crypto");
const Secrets = require("./../Secrets/secrets.js");
const getIsDeveloper = require("./../Helpers/getIsDeveloper.js");
const getSearchArguments = require("./../Helpers/getSearchArguments.js");
const getAccAndChartAsync = require("./../Helpers/getAccAndChartAsync.js");
const getTagsStringified = require("./../Helpers/getTagsStringified.js");
const getChartDescription = require("./../Helpers/getChartDescription.js");
const getParsedSheetsTag = require("./../Helpers/getParsedSheetsTag.js");
const getDbLogString = require("./../Helpers/getDbLogString.js");
const handleDbLogReply = require("./../Helpers/handleDbLogReply.js");
const { ParameterType, Constants, Commands, Tags } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');
const { google } = require('googleapis');

async function cmdSetTags(game, msg){
	var dev = getIsDeveloper(msg);
	if (!dev) {
		msg.reply({content: `You are not a developer. Only developers may set tags.`, allowedMentions: {repliedUser: false}});
		return;
	}

	let searchArgs = getSearchArguments(msg.content);
	let chartParams = await getAccAndChartAsync(game, msg, searchArgs, true);

	if (chartParams.args.length == 0){
		const embedb = new EmbedBuilder()
			.setTitle("⚡ - Set Tags ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(`No chart params found.`);

		msg.reply({ embeds: [embedb], allowedMentions: { repliedUser: false }});
		return;
	}

	let tags = [];
	let tags_id = 0;
	let tags_none = false;
	if (chartParams.args != null){
		chartParams.args.forEach(arg => {
			if (arg.type == ParameterType.TAGS){
				if (arg.value == Tags.NONE){
					tags_none = true;
				} else if (arg.value != Tags.ANY && arg.value != Tags.MATCHING && !tags.includes(arg.value)){
					tags.push(arg.value);
					tags_id |= arg.value.id;
				}
			}
		});
	}

	if (chartParams.chart == null || (tags.length == 0 && !tags_none)){
		let invalidDescription = `No Charts found.${chartParams.invalidDescription}\n`;
		if (tags_id == 0 && !tags_none){
			invalidDescription += `- Tags: \`Invalid ⚠️\``;
		} else {
			invalidDescription += `- Tags: \`${getTagsStringified(Tags, tags_id, tags_none)}\``;
		}
		const embeda = new EmbedBuilder()
			.setTitle("⚡ - Set Tags ⚠️") // TODO: CLEAN
			.setColor(0xCC3333)
			.setDescription(invalidDescription);

		msg.reply({ embeds: [embeda], allowedMentions: { repliedUser: false }});
		msg.react('❌');
		return;
	}

	let chart = chartParams.chart;
	if (tags_none){
		tags_id = 0;
	}

	const query = `INSERT INTO charts
		(hash, dx_version, is_locked, is_international, is_china, title, artist, notes_designer, category, game_version, difficulty, const_uni, const_unip, const_fes, const_fesp, const_bud, const_budp, count_taps, count_holds, count_slides, count_touch, count_break, count_total, tags, bpm, image_file, search_title)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

		ON CONFLICT(hash)
		DO UPDATE SET
		dx_version = ?, is_locked = ?, is_international = ?, is_china = ?, title = ?, artist = ?, notes_designer = ?, category = ?, game_version = ?, difficulty = ?, const_uni = ?, const_unip = ?, const_fes = ?, const_fesp = ?, const_bud = ?, const_budp = ?, count_taps = ?, count_holds = ?, count_slides = ?, count_touch = ?, count_break = ?, count_total = ?, tags = ?, bpm = ?, image_file = ?, search_title = ?
		`;

	let params = [chart.hash, chart.dx_version, chart.is_locked, chart.is_international, chart.is_china, chart.title, chart.artist, chart.notes_designer, chart.category, chart.game_version, chart.difficulty, chart.const_uni, chart.const_unip, chart.const_fes, chart.const_fesp, chart.const_bud, chart.const_budp, chart.count_taps, chart.count_holds, chart.count_slides, chart.count_touch, chart.count_break, chart.count_total, tags_id, chart.bpm, chart.image_file, chart.search_title,

	chart.dx_version, chart.is_locked, chart.is_international, chart.is_china, chart.title, chart.artist, chart.notes_designer, chart.category, chart.game_version, chart.difficulty, chart.const_uni, chart.const_unip, chart.const_fes, chart.const_fesp, chart.const_bud, chart.const_budp, chart.count_taps, chart.count_holds, chart.count_slides, chart.count_touch, chart.count_break, chart.count_total, tags_id, chart.bpm, chart.image_file, chart.search_title];

	let queryLog = getDbLogString(query, params, Commands.ADD.log_string);
	let fail = false;

	await new Promise((resolve, reject) => {
		game.db.run(query, params, function(e) {
			if (e) {
				console.error(`[CMD_SETTAGS]: FAILED to set tag: ${chart.title}`, e);
				fail = true;
				reject(e);
			}
			else {
				console.log(`[CMD_SETTAGS]: SUCCESS in setting tags to ${chart.title}!`);
				resolve();
			}
		});
	});

	if (fail){
		msg.react('❌');
		return;
	}

	// GOOGLE SHEETS
	console.log(`[CMD_SETTAGS]: Trying to Authorize Google Sheets API...`);
	await game.google.authorize();
	console.log(`[CMD_SETTAGS]: Successfully Authorized Google Sheets API...`);

	const spreadsheetId = Secrets.SPREADSHEET_ID;
	const sheetName = 'database';
	const range = `${sheetName}!A:AA`;
	const sheets = google.sheets({
		version: 'v4',
		auth: game.google
	});

	let charts = [];
  let count = 0;
  let response = await sheets.spreadsheets.values.get(
    {
      spreadsheetId: spreadsheetId,
      range: range,
    }
  );

  console.log(`[CMD_SETTAGS]: Obtaining data from Google Sheets...`);
	let row_index = 0;
  response.data.values.forEach(row => {
    try {
      const [id, image_file, title, artist, version, category, dx, difficulty, international, china, locked, uni, unip, fes, fesp, bud, budp, power, tech, intelligence, stamina, trills, spins, distribution, bpm, charter, search_title] = row;
      if (row != null && id != undefined && image_file != undefined && search_title != undefined) {
        // const imagefile = parseImageFile(image_file);
        const hash = Crypto.createHash('md5').update(`${title}-${dx}-${difficulty}`);
        const hex = hash.digest('hex');
        let result = {
          id: parseInt(id),
					hash: hex,
          image_file: image_file,
          title: title,
          artist: artist,
					bpm: parseFloat(bpm),
          version: parseInt(version),
          category: parseInt(category),
          is_dx: parseInt(dx),
          difficulty_id: parseInt(difficulty),
          is_international: parseInt(international),
          is_china: parseInt(china),
          is_locked: parseInt(locked),
          const_uni: parseFloat(uni),
          const_unip: parseFloat(unip),
          const_fes: parseFloat(fes),
          const_fesp: parseFloat(fesp),
          const_bud: parseFloat(bud),
          const_budp: parseFloat(bud),
					distribution: distribution,
					notes_designer: charter,
          is_power: getParsedSheetsTag(power),
          is_tech: getParsedSheetsTag(tech),
          is_intelligence: getParsedSheetsTag(intelligence),
          is_stamina: getParsedSheetsTag(stamina),
          is_trills: getParsedSheetsTag(trills),
          is_spins: getParsedSheetsTag(spins),
          search_title: search_title
        };

        count++;
        charts.push(result);
      }
    } catch (e) {
      console.log(`[CMD_SETTAGS]: GOOGLEAPI FAILED - ${e.message}`);
    }
  });

	charts.forEach((data, index) => {
		if (data.hash == chart.hash){
			row_index = index + 1;
		}
	});

	if (row_index > 0){
		let result_power = "";
		let result_tech = "";
		let result_intelligence = "";
		let result_stamina = "";
		let result_trills = "";
		let result_spins = "";

		if (!tags_none){
			tags.forEach(tag => {
				switch (tag.id) {
					case Tags.POWER.id:
						result_power = "1";
						break;
					case Tags.TECH.id:
						result_tech = "1";
						break;
					case Tags.INTELLIGENCE.id:
						result_intelligence = "1";
						break;
					case Tags.STAMINA.id:
						result_stamina = "1";
						break;
					case Tags.TRILL.id:
						result_trills = "1";
						break;
					case Tags.SPIN.id:
						result_spins = "1";
						break;
					default:
						break;
				}
			});
		}


		let data = charts[row_index];
		let result = [  data.id, data.image_file, data.title, data.artist, data.version, data.category, data.dx, data.difficulty, data.international, data.china, data.locked, data.uni, data.unip, data.fes, data.fesp, data.bud, data.budp, result_power, result_tech, result_intelligence, result_stamina, result_trills, result_spins, data.distribution, data.bpm, data.notes_designer, data.search_title ];

		console.log(`[CMD_SETTAGS]: Updating Google Sheets...`);
		await sheets.spreadsheets.values.update({
				auth: game.google,
	      spreadsheetId: spreadsheetId,
	      range: `${sheetName}!A${row_index}:AA${row_index}`,
	      valueInputOption: "USER_ENTERED",
	      resource : {
	          values: [result]
	      }
	  });

		console.log(`[CMD_SETTAGS]: SUCCESS in updating Google Sheets!`);
	}

	let chart_description = getChartDescription(chartParams.chart);
	let description = `\n- ${chart_description}\n`;
	description += `- Tags: \`${getTagsStringified(Tags, tags_id, tags_none)}\``;

	let embed = new EmbedBuilder()
	.setThumbnail(`attachment://${chart.image_file}`);

	if (fail){
		embed.setTitle("⚡ - Set Tags ⚠️");
		embed.setDescription(`Failed to update local database. (server). (Only devs may use this command).${description}`);
		embed.setColor(0xCC3333);
		msg.react('❌');
	} else if (row_index == 0){
		embed.setTitle("⚡ - Set Tags ⚠️");
		embed.setDescription(`Failed to find matching row in remote database (google-api). (Only devs may use this command).${description}`);
		embed.setColor(0xCC3333);
		msg.react('❌');
	} else {
		embed.setTitle("⚡ - Set Tags");
		embed.setColor(0xCC7733);
		embed.setDescription(`Successfully updated database and tags. (Only devs may use this command).${description}`);
		msg.react('✅');
	}

	handleDbLogReply(queryLog, msg, game);
	const attachment = new AttachmentBuilder(`${Constants.ImageDirectory}${chart.image_file}`);
	msg.reply({ embeds: [embed], files: [attachment], allowedMentions: { repliedUser: false }});
}

module.exports = cmdSetTags;
