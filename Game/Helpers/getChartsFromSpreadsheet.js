const getParsedSheetsTag = require("./getParsedSheetsTag.js");
const crypto = require("crypto");
const fs = require("fs");
const path = require('path');
const axios = require('axios');
const process = require('process');
const { google } = require('googleapis');
const { Constants, Tags } = require('./../constants.js')

const Secrets = require("./../Secrets/secrets.js");

function getChartsFromSpreadsheet(googleClient) {
  return new Promise((resolve, reject) => {
    const sheetName = 'database';
    const range = `${sheetName}!A2:AA`;
    const sheets = google.sheets({
      version: 'v4',
      auth: googleClient,
    });

    console.log(`[INIT]: Connecting to Google Sheets API...`);
    let charts = [];
    let count = 0;
    sheets.spreadsheets.values.get(
      {
        spreadsheetId: Secrets.SPREADSHEET_ID,
        range: range,
      },
      async (err, response) => {
        if (err) {
          console.error(`Error obtaining data from Google Sheets: ${err}`);
          reject(err);
          return;
        }

        console.log(`[INIT]: Obtaining data from Google Sheets...`);
        let image_files = [];
        response.data.values.forEach(row => {
          const [id, image_file, title, artist, version, category, dx, difficulty, international, china, locked, uni, unip, fes, fesp, bud, budp, power, tech, intelligence, stamina, trills, spins, distribution, bpm, charter, search_title] = row;
          if (row != null && id != undefined) {
            const hash = crypto.createHash('md5').update(`${title}-${dx}-${difficulty}`);
            const hex = hash.digest('hex');
            let distribution_values = distribution.split('/');
            count_taps = parseInt(distribution_values[0]);
            count_holds = parseInt(distribution_values[1]);
            count_slides = parseInt(distribution_values[2]);
            count_touch = parseInt(distribution_values[3]);
            count_break = parseInt(distribution_values[4]);
            count_total = parseInt(distribution_values[5]);

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
              const_budp: parseFloat(budp),
              count_taps: count_taps,
              count_holds: count_holds,
              count_slides: count_slides,
              count_touch: count_touch,
              count_break: count_break,
              count_total: count_total,
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
            if (!image_files.includes(image_file)){
              image_files.push(image_file);
            }
          }
        });

        console.log(`[INIT]: ${count} charts obtained from Google Sheets!`);
        resolve({ charts: charts, image_files: image_files });
      }
    );
  });
}

module.exports = getChartsFromSpreadsheet;
