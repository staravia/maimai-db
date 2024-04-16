const fs = require("fs").promises;
const path = require('path');
const process = require('process');
const { Difficulties, Categories, DxVersion, GameVersion, Tags } = require("./../Game/constants.js");
const Sqlite3 = require("sqlite3");
const Crypto = require("crypto");
const Secrets = require("./../Game/Secrets/secrets.js");
const { JWT } = require('google-auth-library');
const { transform } = require('camaro');
const { google } = require('googleapis');

// TODO: move this to constants
const prefixes = [
  "【協】",
  "【光】",
  "【宴】",
  "【蔵】",
  "【即】",
  "【蛸】",
  "【撫】",
  "【星】",
  "【覚】",
  "【傾】",
  "【狂】",
  "【耐】",
  "【疑】",
  "【は】",
  "【奏】",
  "【逆】",
  "【息】",
  "【r】",
  "【玉】",
  "【某】",
  "【J】",
  "【右】",
  "【回】"
];

const googleClient = new JWT({
	keyFile: Secrets.TOKEN_KEYFILE,
	scopes: Secrets.SCOPES,
});

async function getChartIdsFromXml() {
  try {
    const xmlData = await fs.readFile(Secrets.MUSIC_INFO_FILE, 'utf-8');

    const template = {
      pairs: ['//StringID', {
        id: 'id',
        str: 'str'
      }]
    };

    const result = await transform(xmlData, template);
    return result;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function updateSpreadsheetWithIds(idList) {
  idList.pairs.forEach(pair => {
    pair.clean_title = getCleanTitle(pair.str);
  });



  await googleClient.authorize();

  const spreadsheetId = Secrets.SPREADSHEET_ID;
  const sheetName = 'database';
  const range = `${sheetName}!A:G`;
  const sheets = google.sheets({
    version: 'v4',
    auth: googleClient
  });

  let charts = [];
  let count = 0;
  let response = await sheets.spreadsheets.values.get(
    {
      spreadsheetId: spreadsheetId,
      range: range,
    }
  );

  let row_index = 0;
  response.data.values.forEach(row => {
    try {
      const [id, image_file, title, artist, version, category, dx] = row;
      if (row != null && image_file != undefined) {
        let result = {
          id: parseInt(id),
          image_file: image_file,
          title: title,
          artist: artist,
          version: version,
          category: category,
          dx: parseInt(dx),
          row_index: row_index,
          clean_title: getCleanTitle(title)
        };

        count++;
        charts.push(result);
        row_index++;
      }
    } catch (e) {
      console.log(`[ID_UPDATE]: GOOGLEAPI FAILED - ${e.message}`);
      row_index++;
    }
  });

  for (let i = 0; i < charts.length; i++) {
    const chart = charts[i];
    if (chart.row_index > 0 && Number.isNaN(chart.id)) {
      let is_dx = chart.dx != 1;
      let chartId = getChartId(chart, is_dx, idList);

      let result = [chartId, chart.image_file, chart.title, chart.artist, chart.version, chart.category, chart.dx];

      if (chartId != null) {
        let optimized_entry = [ result ];
        let extra_indiciees = 0;

        for (let j = i + 1; j < charts.length; j++) {
          let next_chart = charts[j];

          if (next_chart.title != chart.title || next_chart.dx != chart.dx) {
            break;
          }

          optimized_entry.push(result);
          extra_indiciees++;
          i++;
        }

        console.log(`[ID_UPDATE]: [${chart.row_index}/${row_index}] Updating row: ${chart.title}... id=${chartId}, ${extra_indiciees + 1}x`);


        await sheets.spreadsheets.values.update({
          auth: googleClient,
          spreadsheetId: spreadsheetId,
          range: `${sheetName}!A${chart.row_index + 1}:G${chart.row_index + 1 + extra_indiciees}`,
          valueInputOption: "USER_ENTERED",
          resource: {
            values: optimized_entry
          }
        });

        await new Promise(resolve => setTimeout(resolve, 1010)); // Write limit: 60 per min
      }
    }
  }
}

function getChartId(chart, is_dx, idList){
  const dx_id = 10000;
  let id = null;

  idList.pairs.forEach(pair => {
    // console.log(pair.clean_title);
    if (pair.clean_title == chart.clean_title){
      if (is_dx && pair.id >= dx_id){
        id = pair.id;
      } else if (!is_dx && pair.id < dx_id) {
        id = pair.id;
      }
    }
  });

  if (id == null){
    // console.log(`Error finding matching title: ${chart.title} \n - ${chart.clean_title}`);
  }

  return id;
}

function removePrefix(str) {
  for (const prefix of prefixes) {
    if (str.startsWith(prefix)) {
      return str.slice(prefix.length); // Remove the prefix
    }
  }
  return str; // If no prefix matches, return the original string
}

function getCleanTitle(str){
  str = removePrefix(str);
  str = str.normalize("NFKC").replace(/\p{Diacritic}/gu, "");
  str = str.toLowerCase();
  // str = str.replace(/[^a-zA-Z0-9\s\"\'\\\/,]/g, '');
  str = str.normalize('NFC').replace(`'`, '').replace('！', '!').replace('～', '~').replace('･', '・').replace('（', '(').replace('）', ')');

  return str;
}

async function computeCharts(){
  console.log("[ID_UPDATE]: Getting chart id's...");
  let chartIds = await getChartIdsFromXml();
  console.log("[ID_UPDATE]: Updating spreadsheet...");
  await updateSpreadsheetWithIds(chartIds);
  console.log("[ID_UPDATE]: Done.");
}

computeCharts();
