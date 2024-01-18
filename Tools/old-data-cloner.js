const mai_data_file = "data.json";
const fs = require("fs").promises;
const path = require('path');
const process = require('process');
const { Difficulties, Categories, DxVersion, GameVersion, Tags } = require("./../Game/constants.js");

const Secrets = require("./../Game/Secrets/secrets.js");
const Kuroshiro = require("kuroshiro").default;
const KuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji");
const Sqlite3 = require("sqlite3");
const Crypto = require("crypto");
const Secrets = require("./../Game/Secrets/secrets.js");

const {google} = require('googleapis');

const { JWT } = require('google-auth-library');
const google = new JWT({
	keyFile: Secrets.TOKEN_KEYFILE,
	scopes: Secrets.SCOPES,
});


const { TranslationServiceClient } = require('@google-cloud/translate').v3;
const projectId = 'maimai-db';
const translationClient = new TranslationServiceClient({
  keyFile: Secrets.TOKEN_KEYFILE,
});

async function getTranslatedText(text) {
  const location = 'global';

  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain',
    sourceLanguageCode: 'ja',
    targetLanguageCode: 'en',
  };

	try {
		const [response] = await translationClient.translateText(request);
		const translatedText = response.translations[0].translatedText;
		console.log(translatedText);
		return `, ${translatedText}`;
	} catch (e) {
		console.error(e);
	}

	return "";
}

async function getUniFesFromSpreadsheet(){
	const spreadsheetId = Secrets.SPREADSHEET_ID;
  const sheet_uni = 'uni-unip';
	const sheet_fes = 'fes-fesp';
  const range_uni = `${sheet_uni}!A:Z`;
  const range_fes = `${sheet_fes}!A:Z`;
  const sheets = google.sheets({
    version: 'v4',
    auth: google,
  });

	console.log(`[INIT]: Connecting to Google Sheets API... (Fetching Uni/Fes charts...)`);

	let response_uni = await sheets.spreadsheets.values.get(
    {
      spreadsheetId: spreadsheetId,
      range: range_uni,
    }
  );

	let response_fes = await sheets.spreadsheets.values.get(
    {
      spreadsheetId: spreadsheetId,
      range: range_fes,
    }
  );

	let charts = [];

	response_uni.data.values.forEach(row => {
		const [title, dx, diff, const_uni, const_unip] = row;
		if (title != null && title != undefined && title != "")
		{
			const dx_id = dx == "STD" ? DxVersion.ST.id : DxVersion.DX.id;
			let diff_id = 0;

			switch (diff) {
				case "ReMAS":
					diff_id = Difficulties.REMASTER.id;
					break;
				case "MAS":
					diff_id = Difficulties.MASTER.id;
					break;
				case "EXP":
					diff_id = Difficulties.EXPERT.id;
					break;
			}

			let key = getKey(title, dx_id, diff_id)
			charts[key] = {
				title: title,
				const_uni: parseConstant(const_uni),
				const_unip: parseConstant(const_unip)
			}
		}
	});

	response_fes.data.values.forEach(row => {
		const [title, dx, diff, const_fes, const_fesp] = row;
		if (title != null && title != undefined && title != "")
		{
			const dx_id = dx == "STD" ? DxVersion.ST.id : DxVersion.DX.id;
			let diff_id = 0;

			switch (diff) {
				case "ReMAS":
					diff_id = Difficulties.REMASTER.id;
					break;
				case "MAS":
					diff_id = Difficulties.MASTER.id;
					break;
				case "EXP":
					diff_id = Difficulties.EXPERT.id;
					break;
			}

			let key = getKey(title, dx_id, diff_id)
			if (charts[key] != undefined){
				charts[key].const_fes = const_fes;
				charts[key].const_fesp = const_fesp;
			} else {
				charts[key] = {
					title: title,
					const_uni: 0,
					const_unip: 0,
					const_fes: parseConstant(const_fes),
					const_fesp: parseConstant(const_fesp)
				};
			}
		}
	});

	return charts;
}

function parseConstant(constant){
	if (constant == null || constant == undefined || constant == ""){
		return 0;
	}

	if (constant.includes('+')){
		let num = parseInt(constant);
		num += 0.7;
		return num;
	} else {
		return parseFloat(constant);
	}
}

function getTitle(title){
  return title;
}

function getKey(title, dx_id, diff_id){
	let titleKey = getTitle(title)
	return `${titleKey}-${dx_id}-${diff_id}`;
}

async function getChartsFromSpreadsheet(){
  const spreadsheetId = Secrets.SPREADSHEET_ID;
  const sheetName = 'database';
  const range = `${sheetName}!A2:Z`;
  const sheets = google.sheets({
    version: 'v4',
    auth: google,
  });

  console.log(`[INIT]: Connecting to Google Sheets API... (Fetching old data...)`);
  let charts = [];
  let count = 0;
  let response = await sheets.spreadsheets.values.get(
    {
      spreadsheetId: spreadsheetId,
      range: range,
    }
  );

  console.log(`[INIT]: Obtaining data from Google Sheets...`);
  response.data.values.forEach(row => {
    try {
      const [id, image_file, title, artist, version, category, dx, difficulty, international, locked, uni, unip, fes, fesp, bud, power, tech, intelligence, stamina, trills, spins, search_title] = row;
      if (row != null && id != undefined && image_file != undefined && search_title != undefined) {
        const imagefile = parseImageFile(image_file);
        const hash = Crypto.createHash('md5').update(`${title}-${dx}-${difficulty}`);
        const hex = hash.digest('hex');
        let result = {
          id: parseInt(id),
          hash: hex,
          image_file: imagefile,
          title: title,
          artist: artist,
          version: parseInt(version),
          category: parseInt(category),
          is_dx: parseInt(dx),
          difficulty_id: parseInt(difficulty),
          is_international: parseInt(international),
          is_locked: parseInt(locked),
          const_uni: parseFloat(uni),
          const_unip: parseFloat(unip),
          const_fes: parseFloat(fes),
          const_fesp: parseFloat(fesp),
          const_bud: parseFloat(bud),
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
      console.log(`FAILED: ${e.message}`);
    }
  });

  console.log(`[INIT]: ${count} charts obtaiend from Google Sheets!`);
  return charts;
}

function getMatchingChart(chart, list){
  let titleA = getTitle(chart.title);
  let result = null;
  list.forEach(item =>{
    let titleB = getTitle(item.title);
    if (item.is_dx == chart.dx_version && titleA == titleB && chart.difficulty == item.difficulty_id){
      result = item;
    }
  });

  return result;
}

async function getTranslatedData(mai_data) {
  let translated = {};

	const fileExists = await fs.access('./Tools/translated.json')
      .then(() => true)
      .catch(() => false);

	if (fileExists) {
      const fileData = await fs.readFile('./Tools/translated.json', 'utf8');
      translated = JSON.parse(fileData);
    } else {
      translated = await translateAndSave(mai_data.songs);
    }

	return translated;
}

async function translateAndSave(mai_data){
	let translated = {};

	for (const song of mai_data.songs) {
    try {
      let translatedText = await getTranslatedText(song.title);
      translated[song.title] = translatedText;
    } catch (error) {
      console.error('Error translating:', error);
    }
  }

  const jsonContent = JSON.stringify(translated, null, 2);

  // Write the JSON content to a file named 'translated.json'
  fs.writeFile('./Tools/translated.json', jsonContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return translated;
    }
    console.log('File has been saved');
  });

	return translated;
}

async function handleChartData(prevCharts, uniFesData){
  // read missing charts file
  let charts = [];
  const mai_data_content = await fs.readFile(mai_data_file);
  const mai_data = await JSON.parse(mai_data_content);
  const kuroshiro = new Kuroshiro();
  await kuroshiro.init(new KuromojiAnalyzer());

	translated = await getTranslatedData(mai_data);

  mai_data.songs.forEach(song => {

    song.sheets.forEach(sheet => {
      let dx = 0;
      switch (sheet.type) {
        case "dx":
          dx = DxVersion.DX.id;
          break;
        case "std":
          dx = DxVersion.ST.id;
          break;
				case "utage":
          dx = DxVersion.UTAGE.id;
          break;
        default:
          dx = 0;
      }

      let difficulty = 0;
      switch (sheet.difficulty) {
        case "basic":
          difficulty = Difficulties.BASIC.id;
          break;
        case "advanced":
          difficulty = Difficulties.ADVANCED.id;
          break;
        case "expert":
          difficulty = Difficulties.EXPERT.id;
          break;
        case "master":
          difficulty = Difficulties.MASTER.id;
          break;
        case "remaster":
          difficulty = Difficulties.REMASTER.id;
          break;
				case "【協】":
				case "【光】":
				case "【宴】":
				case "【蔵】":
				case "【即】":
				case "【蛸】":
				case "【撫】":
				case "【星】":
				case "【覚】":
				case "【傾】":
				case "【狂】":
				case "【耐】":
				case "【逆】":
          difficulty = Difficulties.SPECIAL.id;
          break;
        default:
          difficulty = 0;
      }

      let gameVersion = 0;
      switch (song.version) {
        case "maimai":
          gameVersion = GameVersion.MAIMAI.id;
          break;
        case "maimai PLUS":
          gameVersion = GameVersion.MAIMAIPLUS.id;
          break;
        case "GreeN":
          gameVersion = GameVersion.GREEN.id;
          break;
        case "GreeN PLUS":
          gameVersion = GameVersion.GREENPLUS.id;
          break;
        case "ORANGE":
          gameVersion = GameVersion.ORANGE.id;
          break;
        case "ORANGE PLUS":
          gameVersion = GameVersion.ORANGEPLUS.id;
          break;
        case "PiNK":
          gameVersion = GameVersion.PINK.id;
          break;
        case "PiNK PLUS":
          gameVersion = GameVersion.PINKPLUS.id;
          break;
        case "MURASAKi":
          gameVersion = GameVersion.MURASAKI.id;
          break;
        case "MURASAKi PLUS":
          gameVersion = GameVersion.MURASAKIPLUS.id;
          break;
        case "MiLK":
          gameVersion = GameVersion.MILK.id;
          break;
        case "MiLK PLUS":
          gameVersion = GameVersion.MILKPLUS.id;
          break;
        case "FiNALE":
          gameVersion = GameVersion.FINALE.id;
          break;
        case "maimaiでらっくす":
          gameVersion = GameVersion.DX.id;
          break;
        case "maimaiでらっくす PLUS":
          gameVersion = GameVersion.DXPLUS.id;
          break;
        case "Splash":
          gameVersion = GameVersion.SPLASH.id;
          break;
        case "Splash PLUS":
          gameVersion = GameVersion.SPLASHPLUS.id;
          break;
        case "UNiVERSE":
          gameVersion = GameVersion.UNIVERSE.id;
          break;
        case "UNiVERSE PLUS":
          gameVersion = GameVersion.UNIVERSEPLUS.id;
          break;
        case "FESTiVAL":
          gameVersion = GameVersion.FESTIVAL.id;
          break;
        case "FESTiVAL PLUS":
          gameVersion = GameVersion.FESTIVALPLUS.id;
          break;
        case "BUDDiES":
          gameVersion = GameVersion.BUDDIES.id;
          break;
      }

			let category = 0;
			switch(song.category){
				case "POPS＆アニメ":
					category = Categories.ANIME.id;
					break;
				case "niconico＆ボーカロイド":
					category = Categories.NICONICO.id;
					break;
				case "東方Project":
					category = Categories.TOHO.id;
					break;
				case "ゲーム＆バラエティ":
					category = Categories.VARIETY.id;
					break;
				case "maimai":
					category = Categories.MAIMAI.id;
					break;
				case "オンゲキ＆CHUNITHM":
					category = Categories.CHUGEKI.id;
					break;
				case "宴会場":
					category = Categories.UTAGE.id;
					break;
			}

      const hash = Crypto.createHash('md5').update(`${song.title}-${dx}-${difficulty}`);
      const hex = hash.digest('hex');

			let count_taps = sheet.noteCounts.tap == null ? 0 : sheet.noteCounts.tap;
			let count_holds = sheet.noteCounts.hold == null ? 0 : sheet.noteCounts.hold;
			let count_slides = sheet.noteCounts.slide == null ? 0 : sheet.noteCounts.slide;
			let count_touch = sheet.noteCounts.touch == null ? 0 : sheet.noteCounts.touch;
			let count_break = sheet.noteCounts.break == null ? 0 : sheet.noteCounts.break;
			let count_total = sheet.noteCounts.total == null ? 0 : sheet.noteCounts.total;

      let chart = {
				id: "N/A",
        title: song.title,
        artist: song.artist,
        bpm: song.bpm,
        notes_designer: sheet.noteDesigner == "-" ? "" : sheet.noteDesigner,
        difficulty: difficulty, // TODO:
        game_version: gameVersion, // TODO
        category: category, // // TODO
        dx_version: dx, // // TODO
        is_locked: song.isLocked == true ? 1 : 0, // TODO:
        is_international: sheet.regions.intl == true ? 1 : 0, // TODO:
        is_china: sheet.regions.cn == true ? 1 : 0, // TODO:
        tags: 0, // TODO:
        image_file: song.imageName,
        count_taps: count_taps,
        count_holds: count_holds,
        count_slides: count_slides,
        count_touch: count_touch,
        count_break: count_break,
        count_total: count_total,
				count_distribution: `${count_taps} / ${count_holds} / ${count_slides} / ${count_touch} / ${count_break} / ${count_total}`,
        search_title: "", // TODO:
        const_uni: 0, // TODO:
        const_unip: 0, // TODO:
        const_fes: 0, // TODO:
        const_fesp: 0, // TODO:
        const_bud: sheet.internalLevelValue,
        search_title: "", // TODO:
				is_power: false,
				is_tech: false,
				is_intelligence: false,
				is_stamina: false,
				is_trills: false,
				is_spins: false,
      };

			if (gameVersion == 0){
				console.log(song.version);
				console.log(`${chart.title} - ${chart.artist} - ${difficulty} - ${gameVersion}`);
			}

      let matching = getMatchingChart(chart, prevCharts);
      if (matching != null){
        chart.const_uni = matching.const_uni;
        chart.const_unip = matching.const_unip;
        chart.const_fes = matching.const_fes;
        chart.const_fesp = matching.const_fesp;
        chart.tags = matching.tags;
        chart.search_title = matching.search_title;
        chart.is_power = matching.is_power;
        chart.is_tech = matching.is_tech;
        chart.is_intelligence = matching.is_intelligence;
        chart.is_stamina = matching.is_stamina;
        chart.is_trills = matching.is_trills;
        chart.is_spins = matching.is_spins;
				chart.id = matching.id;
      } else {
				// console.log(`${chart.title} - ${chart.artist} - ${difficulty} - ${gameVersion}`);

				let key = getKey(chart.title, chart.dx_version, chart.difficulty);
				// console.log(`KEY: ${key}`);
				if (uniFesData[key] != undefined){
					let reference = uniFesData[key];
					chart.const_uni = reference.const_uni;
					chart.const_unip = reference.const_unip;
					chart.const_fes = reference.const_fes;
					chart.const_fesp = reference.const_fesp;
					// console.log("FOUND");
				}
			}

			if (category == Categories.UTAGE.id && chart.const_bud == 0){
				chart.const_bud = 1;
			}

			switch (gameVersion) {
				case GameVersion.BUDDIES.id:
					if (chart.const_bud == 0){
						chart.const_bud = 1;
					}

					if (chart.const_fesp == 0){
						chart.const_fesp = `${chart.const_bud}*`;
						chart.const_fes = `${chart.const_fesp}`;
						chart.const_unip = `${chart.const_fes}`;
						chart.const_uni = `${chart.const_unip}`;
					} else if (chart.const_fes == 0){
						chart.const_fes = `${chart.const_fesp}*`;
						chart.const_unip = `${chart.const_fes}`;
						chart.const_uni = `${chart.const_unip}`;
					} else if (chart.const_unip == 0){
						chart.const_unip = `${chart.const_fes}*`;
						chart.const_uni = `${chart.const_unip}`;
					} else if (chart.const_uni == 0){
						chart.const_uni = `${chart.const_unip}*`;
					}
					break;
				case GameVersion.FESTIVALPLUS.id:
					if (chart.const_fesp == 0){
						chart.const_fesp = chart.const_bud;
					}

					if (chart.const_fes == 0){
						chart.const_fes = `${chart.const_fesp}*`;
						chart.const_unip = `${chart.const_fes}`;
						chart.const_uni = `${chart.const_unip}`;
					} else if (chart.const_unip == 0){
						chart.const_unip = `${chart.const_fes}*`;
						chart.const_uni = `${chart.const_unip}`;
					} else if (chart.const_uni == 0){
						chart.const_uni = `${chart.const_unip}*`;
					}
					break;
				case GameVersion.FESTIVAL.id:
					if (chart.const_fesp == 0){
						chart.const_fesp = chart.const_bud;
					} else if (chart.const_fes == 0){
						chart.const_fes = chart.const_fesp;
					}

					if (chart.const_unip == 0){
						chart.const_unip = `${chart.const_fes}*`;
						chart.const_uni = `${chart.const_unip}`;
					} else if (chart.const_uni == 0){
						chart.const_uni = `${chart.const_unip}*`;
					}
					break;
				case GameVersion.UNIVERSEPLUS.id:
					if (chart.const_fesp == 0){
						chart.const_fesp = chart.const_bud;
					} if (chart.const_fes == 0){
						chart.const_fes = chart.const_fesp;
					} if (chart.const_unip == 0){
						chart.const_unip = chart.const_fes;
					}

					if (chart.const_uni == 0){
						chart.const_uni = `${chart.const_unip}*`;
					}
					break;
				default:
					if (chart.const_fesp == 0){
						chart.const_fesp = chart.const_bud;
					} if (chart.const_fes == 0){
						chart.const_fes = chart.const_fesp;
					} if (chart.const_unip == 0){
						chart.const_unip = chart.const_fes;
					} if (chart.const_uni == 0){
						chart.const_uni = chart.const_unip;
					}
					break;
			}

      charts.push(chart);
    });
  });

	for (chart of charts){
		try {
			let translatedText = translated[chart.title];
			let str = await kuroshiro.convert(`${chart.title}, ${chart.artist}${translatedText}`, { to: "romaji" });
			str = str.normalize("NFKC").replace(/\p{Diacritic}/gu, "");
			str = str.toLowerCase();
			str = str.replace(/[^a-zA-Z0-9\s\"\'\\\/,]/g, '');
			str = str.normalize('NFC').replace(`'`, '').replace('！', '!').replace('～', '~').replace('･', '・').replace('（', '(').replace('）', ')');

			if (chart.search_title == ""){
				str = `${str}, ${chart.title}, ${chart.artist}`;
				str = str.normalize('NFC').replace(`'`, '').replace('！', '!').replace('～', '~').replace('･', '・').replace('（', '(').replace('）', ')');
				str = str.replace('（', '(').replace('）', ')');
			} else {
				str = `${str}, ${chart.search_title}`;
			}

			chart.search_title = str.toLowerCase();
		}
		catch {
			console.log(`[DBERROR]: Failed to convert to romaji/tags: ${chart.artist}, ${chart.title}`);
			chart.search_title = chart.title;
		}
	}



	let results = [];

	// id, image_file, title, artist, version, category, dx, difficulty, international, locked, uni, unip, fes, fesp, bud, power, tech, intelligence, stamina, trills, spins, search_title]
	charts.forEach(chart => {
		let result = [
			chart.id,
			chart.image_file,
			chart.title,
			chart.artist,
			chart.game_version,
			chart.category,
			chart.dx_version,
			chart.difficulty,
			chart.is_international,
			chart.is_china,
			chart.is_locked,
			chart.const_uni,
			chart.const_unip,
			chart.const_fes,
			chart.const_fesp,
			chart.const_bud,
			chart.is_power ? "1" : "",
			chart.is_tech ? "1" : "",
			chart.is_intelligence ? "1" : "",
			chart.is_stamina ? "1" : "",
			chart.is_trills ? "1" : "",
			chart.is_spins ? "1" : "",
			chart.count_distribution,
			chart.bpm,
			chart.notes_designer,
			chart.search_title
		];
		results.push(result);
	})

	const spreadsheetId = Secrets.SPREADSHEET_ID;
  const sheetName = 'test';
  const range = `${sheetName}!A2:Z`;
  const sheets = google.sheets({
    version: 'v4',
    auth: google,
  });

	console.log(`[CMD_SETTAGS]: Updating Google Sheets...`);
	await sheets.spreadsheets.values.update({
			auth: google,
			spreadsheetId: spreadsheetId,
			range: `${sheetName}!A2:Z`,
			valueInputOption: "USER_ENTERED",
			resource : {
					values: results
			}
	});

  console.log(mai_data.songs.length);
}

function parseImageFile(str){
  const Image_Prefix = "https://maimaidx-eng.com/maimai-mobile/img/Music/";
  const Image_Prefix_b = "https://dp4p6x0xfi5o9.cloudfront.net/maimai/img/cover/"

  if (str.indexOf(Image_Prefix) == 0){
    var result = str.substring(Image_Prefix.length);
    return result;
  }

  var result = str.substring(Image_Prefix_b.length);
  return result;
}

async function computeCharts(){
  console.log("Getting charts from spreadsheet...");
  let prevCharts = await getChartsFromSpreadsheet();
	let uniFesData = await getUniFesFromSpreadsheet();
  console.log("Computing charts...");
  await handleChartData(prevCharts, uniFesData);
}

computeCharts();
