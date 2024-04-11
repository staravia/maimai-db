const getChartsFromSpreadsheet = require("./getChartsFromSpreadsheet.js");
const crypto = require("crypto");
const fs = require("fs");
const path = require('path');
const axios = require('axios');
const process = require('process');
const { google } = require('googleapis');
const { Constants, Tags } = require('./../constants.js')

const Secrets = require("./../Secrets/secrets.js");

async function handleSyncSheetsAsync(googleClient, db, msg = null){
  console.log("[INIT]: Authorizing Google API ...");
  await googleClient.authorize();
  console.log("[INIT]: Successfully Authorized Google API!");
  let results = await getChartsFromSpreadsheet(googleClient);
  console.log("[INIT]: Successfully Fetched data from Google Sheets!");
  await downloadImagesFromWebAsync(results.image_files);
  console.log("[INIT]: Successfully Downloaded new image files!");
  let count = await initChartsAsync(db, results.charts);

  if (msg != null){
    if (count == 0){
      msg.reply(`No changes were detected in the spreadsheet.`);
    } else {
      msg.reply(`Database updated! \`${count} charts\` were scanned. (Only devs may use this command.)`);
    }
  }
}

async function initChartsAsync(db, charts) {
  let changes = 0;
  console.log(`[INIT]: Initializing database...`);
  return await new Promise((resolve, reject) => {
    db.serialize(() => {
      charts.forEach((chart, i) => {
        // We want to iterate through every chart and query it into a database
        if (chart != undefined){
          const isLast = i == charts.length - 2;
          const query = `INSERT INTO charts
            (hash, dx_version, is_locked, is_international, is_china, title, artist, notes_designer, category, game_version, difficulty, const_uni, const_unip, const_fes, const_fesp, const_bud, const_budp, count_taps, count_holds, count_slides, count_touch, count_break, count_total, tags, bpm, image_file, search_title)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

            ON CONFLICT(hash)
            DO UPDATE SET
            dx_version = ?, is_locked = ?, is_international = ?, is_china = ?, title = ?, artist = ?, notes_designer = ?, category = ?, game_version = ?, difficulty = ?, const_uni = ?, const_unip = ?, const_fes = ?, const_fesp = ?, const_bud = ?, const_budp = ?, count_taps = ?, count_holds = ?, count_slides = ?, count_touch = ?, count_break = ?, count_total = ?, tags = ?, bpm = ?, image_file = ?, search_title = ?
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

          db.run(query, [chart.hash, chart.is_dx, chart.is_locked, chart.is_international, chart.is_china, chart.title, chart.artist, chart.notes_designer, chart.category, chart.version, chart.difficulty_id, chart.const_uni, chart.const_unip, chart.const_fes, chart.const_fesp, chart.const_bud, chart.const_budp, chart.count_taps, chart.count_holds, chart.count_slides, chart.count_touch, chart.count_break, chart.count_total, tags, chart.bpm, chart.image_file, chart.search_title,

            chart.is_dx, chart.is_locked, chart.is_international, chart.is_china, chart.title, chart.artist, chart.notes_designer, chart.category, chart.version, chart.difficulty_id, chart.const_uni, chart.const_unip, chart.const_fes, chart.const_fesp, chart.const_bud, chart.const_budp, chart.count_taps, chart.count_holds, chart.count_slides, chart.count_touch, chart.count_break, chart.count_total, tags, chart.bpm, chart.image_file, chart.search_title

          ], function(e) {
            if (e) {
              console.error(`[INIT]: Failed to query chart: ${chart.title}`, e);
            } else {
              changes += this.changes;
            }
            // TODO: there might be case where LAST song is not a re:master
            if (isLast) {
              console.log(`[INIT]: SUCCESS in querying ${i + 1} charts!`);
              console.log(`[INIT]: Charts synced into database: ${changes}`);
              resolve(changes);
            }
          });
        }
      });
    });
  });
}

async function downloadImagesFromWebAsync(image_files) {
  console.log("[INIT]: Checking for Song Jackets to download...");
  let count = 0;

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

  console.log(`[INIT]: Done downloading [${count}] new images...`);
}

module.exports = handleSyncSheetsAsync;
