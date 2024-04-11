const getParsedSheetsTag = require("./getParsedSheetsTag.js");
const crypto = require("crypto");
const fs = require("fs");
const path = require('path');
const axios = require('axios');
const process = require('process');
const { google } = require('googleapis');
const { Constants, Tags } = require('./../constants.js')

const Secrets = require("./../Secrets/secrets.js");

async function handleDatabaseUpdateAsync(googleClient, db, msg = null){
  await googleClient.authorize();
  // let oldCharts = await getChartsFromSpreadsheet(googleClient);
  let newCharts = await getNewCharts(Secrets.DATABASE_URL);

  console.log(newCharts);
  // let count = await initChartsAsync(db, charts);

  // if (msg != null){
  //   if (count == 0){
  //     msg.reply(`No changes were detected in the spreadsheet.`);
  //   } else {
  //     msg.reply(`Database updated! \`${count} charts\` were scanned. (Only devs may use this command.)`);
  //   }
  // }
}

async function getNewCharts(url){
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (e) {
    console.error('Error fetching JSON:', e);
    throw error; // Optional: propagate the error
  }
}

module.exports = handleDatabaseUpdateAsync;
