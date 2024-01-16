const Sqlite3 = require("sqlite3");
const Secrets = require("./../Game/Secrets/secrets.js");
const handleInitDatabaseAsync = require('./../Game/Helpers/handleInitDatabaseAsync.js');
const handleSyncSheetsAsync = require('./../Game/Helpers/handleSyncSheetsAsync.js');
const db = new Sqlite3.Database('./maimai-db.db');
const backup = new Sqlite3.Database('./maimai-db-backup.db');
const { JWT } = require('google-auth-library');

const googleClient = new JWT({
	keyFile: Secrets.TOKEN_KEYFILE,
	scopes: Secrets.SCOPES,
});

// Set Bot Discord Presence
async function updateScores(){
  const score_query = `SELECT * FROM scores`;
	let scores = await new Promise((resolve, reject) => {
		backup.all(score_query, (e, scores) => {
			if (e) {
				console.log("[LOAD_OLD_SCORES]: Failed to load scores.");
				reject(e);
			} else {
				resolve(scores);
			}
		});
	});

  const guild_query = `SELECT * FROM guilds`;
	let guilds = await new Promise((resolve, reject) => {
		backup.all(guild_query, (e, guilds) => {
			if (e) {
				console.log("[LOAD_OLD_SCORES]: Failed to load guild.");
				reject(e);
			} else {
				resolve(guilds);
			}
		});
	});

  const user_query = `SELECT * FROM users`;
	let users = await new Promise((resolve, reject) => {
		backup.all(user_query, (e, users) => {
			if (e) {
				console.log("[LOAD_OLD_SCORES]: Failed to load users.");
				reject(e);
			} else {
				resolve(users);
			}
		});
	});

  console.log(`[LOAD_OLD_SCORES]: SCORES: ${scores.length}`);
  console.log(`[LOAD_OLD_SCORES]: GUILDS: ${guilds.length}`);
  console.log(`[LOAD_OLD_SCORES]: USERS: ${users.length}`);

  db.serialize(() => {

    guilds.forEach((guild, i) => {
      const query = `INSERT INTO guilds (id, db_channel_id, scores_channel_id, game_version, international_version) VALUES (${guild.id}, ${guild.db_channel_id}, ${guild.scores_channel_id}, ${guild.game_version}, ${guild.international_version})
      ON CONFLICT(id) DO UPDATE SET db_channel_id = ${guild.db_channel_id}, scores_channel_id = ${guild.scores_channel_id}, game_version = ${guild.game_version}, international_version = ${guild.international_version}`;
      console.log(`[LOAD_OLD_SCORES]: GUILDS: ${i+1}/${guilds.length} - ${guild.id}`);

        db.run(query, function(e) {
          if (e) {
            console.error(`[LOAD_OLD_SCORES]: FAILED to submit guild:`, e);
          } else {

          }
        });
      });


    scores.forEach((score, i) => {
      let query = `INSERT INTO scores
        (hash, user_id, chart_hash, accuracy, rating_uni, rating_unip, rating_fes, rating_fesp, rating_bud, message_url, date_unix) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(hash) DO UPDATE SET user_id = ?, chart_hash = ?, accuracy = ?, rating_uni = ?, rating_unip = ?, rating_fes = ?, rating_fesp = ?, rating_bud = ?, message_url = ?, date_unix = ?`;

      let params = [score.hash, score.user_id, score.chart_hash, score.accuracy, score.rating_uni, score.rating_unip, score.rating_fes, score.rating_fesp, score.rating_bud, score.message_url, score.date_unix, score.user_id, score.chart_hash, score.accuracy, score.rating_uni, score.rating_unip, score.rating_fes, score.rating_fesp, score.rating_bud, score.message_url, score.date_unix];

      console.log(`[LOAD_OLD_SCORES]: SCORES: ${i+1}/${scores.length} - ${score.hash}`);

        db.run(query, params, function(e) {
          if (e) {
            console.error(`[LOAD_OLD_SCORES]: FAILED to submit score:`, e);
          } else {

          }
        });
      });
    });

    users.forEach((user, i) => {
      const query = `INSERT INTO users (id, alias, color, scores_submitted, rating_uni, rating_unip, rating_fes, rating_fesp, rating_bud, count_uni, count_unip, count_fes, count_fesp, count_bud) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

      ON CONFLICT(id) DO UPDATE SET alias = ?, color = ?
      `;

      let params = [user.id, user.alias, user.color, user.scores_submitted, user.rating_uni, user.rating_unip, user.rating_fes, user.rating_fesp, user.rating_bud, user.count_uni, user.count_unip, user.count_fes, user.count_fesp, user.count_bud, user.alias, user.color];
      console.log(`[LOAD_OLD_SCORES]: USERS: ${i+1}/${users.length} - ${user.id}`);

        db.run(query, params, function(e) {
          if (e) {
            console.error(`[LOAD_OLD_SCORES]: FAILED to submit guild:`, e);
          } else {

          }
        });
      });
}

async function init(){
  console.log("Initializing database...");
  await handleInitDatabaseAsync(db);
  console.log("Initializing Sheets Database sync...");
  await handleSyncSheetsAsync(googleClient, db);
  console.log("Updating database...");
  await updateScores();
  console.log("Done.");
}

init();
