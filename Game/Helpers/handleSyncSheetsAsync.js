const getChartsFromSpreadsheet = require("./getChartsFromSpreadsheet.js");
const crypto = require("crypto");
const fs = require("fs");
const path = require('path');
const axios = require('axios');
const process = require('process');
const { google } = require('googleapis');
const { Constants, Difficulties, Categories, DxVersion, GameVersion, Tags } = require('./../constants.js')

const Secrets = require("./../Secrets/secrets.js");
const Kuroshiro = require("kuroshiro").default;
const KuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji");

const { TranslationServiceClient } = require('@google-cloud/translate').v3;
const projectId = 'maimai-db';
const translationClient = new TranslationServiceClient({
  keyFile: Secrets.TOKEN_KEYFILE,
});

async function handleSyncSheetsAsync(googleClient, db, msg = null){
  console.log("[SYNC]: Looking for new charts ...");
  let newCharts = await getNewCharts(Secrets.DATABASE_URL);
  console.log("[SYNC]: Authorizing Google API ...");
  await googleClient.authorize();
  console.log("[SYNC]: Successfully Authorized Google API!");
  let results = await getChartsFromSpreadsheet(googleClient);
  console.log(`[SYNC]: Successfully Fetched ${results.charts.length} charts from Google Sheets!`);

  results = await sanitizeNewCharts(googleClient, results, newCharts);

  if (msg != null){
    msg.reply(`Adding new charts... Total found: \`${results.inserted_charts.length}\`. Please wait...`);
  }

  await appendNewCharts(googleClient, results, msg);
  await downloadImagesFromWebAsync(results.image_files);
  console.log("[SYNC]: Successfully Downloaded new image files!");
  let count = await initChartsAsync(db, results.charts);

  if (msg != null){
    if (count == 0){
      msg.reply(`No changes were detected in the spreadsheet.`);
    } else {
      msg.reply(`Database updated! \`${count} charts\` were scanned. (Only devs may use this command.)`);
    }
  }
}

async function appendNewCharts(googleClient, results, msg = null){
  const sheetName = 'database';
  const spreadsheetId = Secrets.SPREADSHEET_ID;
  const range = `${sheetName}!A2:AA`;
  const sheets = google.sheets({
    version: 'v4',
    auth: googleClient,
  });

  for (let i = 0; i < results.inserted_charts.length; i ++){
    if (msg != null && i%10 == 0 || i == results.inserted_charts.length - 1){
      msg.reply(`Adding new charts... Progress: \`${i + 1}/${results.inserted_charts.length}\``);
    }

    const data = results.inserted_charts[i];
    const const_bud = data.const_bud == 0 ? `${data.const_budp}*` : data.const_bud;

    let result = [ data.id, data.image_file, data.title, data.artist, data.game_version, data.category, data.dx_version, data.difficulty, data.is_international, data.is_china, data.is_locked, `${data.const_budp}*`, `${data.const_budp}*`, `${data.const_budp}*`, `${data.const_budp}*`, const_bud, data.const_budp, "", "", "", "", "", "", data.distribution, data.bpm, data.notes_designer, data.search_title ];

    await sheets.spreadsheets.values.append({
        auth: googleClient,
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A:AA`,
        valueInputOption: "USER_ENTERED",
        resource : {
            values: [result]
        }
    });
  }
}

async function sanitizeNewCharts(googleClient, results, newCharts){
  const kuroshiro = new Kuroshiro();
  await kuroshiro.init(new KuromojiAnalyzer());

  let inserted_charts = [];

  for (let i = 0; i < newCharts.length; i++) { // arbitrary number after fes+
    const chart = newCharts[i];
    const matching = getMatchingChart(chart, results.charts);

    if (matching != null) {
      continue;
    }

    if (!results.image_files.includes(chart.image_file)){
      results.image_files.push(chart.image_file);
    }

    inserted_charts.push(chart);
  }

  let translated = {};

	for (let i = 0; i < inserted_charts.length; i++) {
    const chart = inserted_charts[i];

    try {
      if (translated[chart.title] != undefined) {
        continue;
      }

      let translatedText = await getTranslatedTextAsync(chart.title);
      translated[chart.title] = translatedText;

      console.log(`[SYNC]: [${i}/${inserted_charts.length}] New song has been translated: ${chart.title} -> ${translatedText}`);
    } catch (error) {
      console.error('Error translating:', error);
    }
  }

  for (chart of inserted_charts){
		try {
			let translatedText = translated[chart.title];
			let str = await kuroshiro.convert(`${chart.title}, ${chart.artist}, ${translatedText}`, { to: "romaji" });
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
		catch (e) {
      console.log(e);
			console.log(`[DBERROR]: Failed to convert to romaji/tags: ${chart.artist}, ${chart.title}`);
			chart.search_title = chart.title;
		}
	}

  results.inserted_charts = inserted_charts;
  return results;
}

async function getTranslatedTextAsync(text) {
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
		return translatedText;
	} catch (e) {
		console.error(e);
	}

	return "";
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

function getTitle(title){
  return title;
}

async function getNewCharts(url){
  try {
    const response = await axios.get(url);

    let charts = [];

    for (let i = 1320; i < response.data.songs.length; i++) { // arbitrary number after fes+
    const song = response.data.songs[i];

      song.sheets.forEach((sheet) => {

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
          case "【疑】":
          case "【は】":
          case "【奏】":
  				case "【逆】":
          case "【息】":
          case "【r】":
          case "【玉】":
          case "【某】":
          case "【J】":
          case "【右】":
          case "【回】":
            difficulty = Difficulties.SPECIAL.id;
            break;
          default:
            difficulty = Difficulties.SPECIAL.id;
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
          case "BUDDiES PLUS":
            gameVersion = GameVersion.BUDDIESPLUS.id;
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

        // const hash = Crypto.createHash('md5').update(`${song.title}-${dx}-${difficulty}`);
        // const hex = hash.digest('hex');

  			let count_taps = sheet.noteCounts.tap == null ? 0 : sheet.noteCounts.tap;
  			let count_holds = sheet.noteCounts.hold == null ? 0 : sheet.noteCounts.hold;
  			let count_slides = sheet.noteCounts.slide == null ? 0 : sheet.noteCounts.slide;
  			let count_touch = sheet.noteCounts.touch == null ? 0 : sheet.noteCounts.touch;
  			let count_break = sheet.noteCounts.break == null ? 0 : sheet.noteCounts.break;
  			let count_total = sheet.noteCounts.total == null ? 0 : sheet.noteCounts.total;

        var chart = {
          // hash: hex,
          image_file: song.imageName,
          title: song.title,
          artist: song.artist,
          difficulty: difficulty,
          game_version: gameVersion,
          category: category,
          dx_version: dx,
          is_locked: song.isLocked == true ? 1 : 0,
          is_international: sheet.regions.intl == true ? 1 : 0,
          is_china: sheet.regions.cn == true ? 1 : 0,
          const_uni: 0,
          const_unip: 0,
          const_fes: 0,
          const_fesp: 0,
          const_bud: song.version != "BUDDiES PLUS" ? sheet.internalLevelValue : 0,
          const_budp: sheet.internalLevelValue,
          count_taps: count_taps,
          count_holds: count_holds,
          count_slides: count_slides,
          count_touch: count_touch,
          count_break: count_break,
          count_total: count_total,
          distribution: `${count_taps} / ${count_holds} / ${count_slides} / ${count_touch} / ${count_break} / ${count_total}`,
          bpm: song.bpm,
          notes_designer: sheet.noteDesigner == "-" ? "" : sheet.noteDesigner,
          search_title: "",
        };
        charts.push(chart);
      });
    }


    return charts;
  } catch (e) {
    console.error('Error fetching JSON:', e);
    throw e;
  }
}

async function initChartsAsync(db, charts) {
  let changes = 0;
  return await new Promise((resolve, reject) => {
    db.serialize(() => {
      charts.forEach((chart, i) => {
        // We want to iterate through every chart and query it into a database
        if (chart != undefined){
          const isLast = i == charts.length - 2;
          const query = `INSERT INTO charts
            (hash, id, dx_version, is_locked, is_international, is_china, title, artist, notes_designer, category, game_version, difficulty, const_uni, const_unip, const_fes, const_fesp, const_bud, const_budp, count_taps, count_holds, count_slides, count_touch, count_break, count_total, tags, bpm, image_file, search_title)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

            ON CONFLICT(hash)
            DO UPDATE SET
            id = ?, dx_version = ?, is_locked = ?, is_international = ?, is_china = ?, title = ?, artist = ?, notes_designer = ?, category = ?, game_version = ?, difficulty = ?, const_uni = ?, const_unip = ?, const_fes = ?, const_fesp = ?, const_bud = ?, const_budp = ?, count_taps = ?, count_holds = ?, count_slides = ?, count_touch = ?, count_break = ?, count_total = ?, tags = ?, bpm = ?, image_file = ?, search_title = ?
            `;

          // Insert chart into database
          let tags = 0;

          if (chart.is_power){
            tags |= Tags.POWER.id;
          } if (chart.is_tech){
            tags |= Tags.TECH.id;
          } if (chart.is_intelligence){
            tags |= Tags.INTELLIGENCE.id;
          } if (chart.is_stamina){
            tags |= Tags.STAMINA.id;
          } if (chart.is_trills){
            tags |= Tags.TRILL.id;
          } if (chart.is_spins){
            tags |= Tags.SPIN.id;
          }

          db.run(query, [chart.hash, chart.id, chart.is_dx, chart.is_locked, chart.is_international, chart.is_china, chart.title, chart.artist, chart.notes_designer, chart.category, chart.version, chart.difficulty_id, chart.const_uni, chart.const_unip, chart.const_fes, chart.const_fesp, chart.const_bud, chart.const_budp, chart.count_taps, chart.count_holds, chart.count_slides, chart.count_touch, chart.count_break, chart.count_total, tags, chart.bpm, chart.image_file, chart.search_title,

            chart.id, chart.is_dx, chart.is_locked, chart.is_international, chart.is_china, chart.title, chart.artist, chart.notes_designer, chart.category, chart.version, chart.difficulty_id, chart.const_uni, chart.const_unip, chart.const_fes, chart.const_fesp, chart.const_bud, chart.const_budp, chart.count_taps, chart.count_holds, chart.count_slides, chart.count_touch, chart.count_break, chart.count_total, tags, chart.bpm, chart.image_file, chart.search_title

          ], function(e) {
            if (e) {
              console.error(`[SYNC]: Failed to query chart: ${chart.title}`, e);
            } else {
              changes += this.changes;
            }
            // TODO: there might be case where LAST song is not a re:master
            if (isLast) {
              console.log(`[SYNC]: SUCCESS in querying ${i + 1} charts!`);
              console.log(`[SYNC]: Charts synced into database: ${changes}`);
              resolve(changes);
            }
          });
        }
      });
    });
  });
}

async function downloadImagesFromWebAsync(image_files) {
  console.log("[SYNC]: Checking for Song Jackets to download...");
  let count = 0;

  if (!fs.existsSync(Constants.ImageDirectory)){
      fs.mkdirSync(Constants.ImageDirectory);
  }

  for (image of image_files) {
    const imageUrl = `https://dp4p6x0xfi5o9.cloudfront.net/maimai/img/cover/${image}`;
    const imageFilename = path.basename(imageUrl);
    const imagePath = path.join(Constants.ImageDirectory, imageFilename);

    if (!fs.existsSync(imagePath)) {
      try {
        const response = await axios.get(imageUrl, { responseType: 'stream' });
        response.data.pipe(fs.createWriteStream(imagePath));

        console.log(`Image ${imageUrl} downloaded and saved as ${imagePath}`);
        count++;
      } catch (error) {
        console.error(`Error downloading image ${imageUrl}:`, error.message);
      }
    }
  }

  console.log(`[SYNC]: Done downloading [${count}] new images...`);
}

module.exports = handleSyncSheetsAsync;
