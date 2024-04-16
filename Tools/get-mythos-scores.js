const Sqlite3 = require("sqlite3");
const Secrets = require("./../Game/Secrets/secrets.js");

const grpc = require('@grpc/grpc-js');
const db = new Sqlite3.Database('./maimai-db.db');
const handleApiCalls = require("./../Game/Helpers/handleApiCalls.js");
const getRatingStats = require("./../Game/Helpers/getRatingStats.js");

async function getScoresFromMythos(chart) {
  let lvl = 0;

  switch(chart.difficulty){
    case 1:
      lvl = 1;
      break;
    case 2:
      lvl = 2;
      break;
    case 4:
      lvl = 3;
      break;
    case 8:
      lvl = 4;
      break;
    case 16:
      lvl = 5;
      break;
  }

  if (lvl == 0) {
    return null;
  }

  const requestMetadata = new grpc.Metadata();
  requestMetadata.add('Authorization', `${Secrets.MYTHOS_API}`);

  const request = {
    music_id: chart.id,
    level: lvl,
    ranking_type: 1 // achievement vs dx (970294) = 97.02%
  };

  var response = await new Promise((resolve, reject) => {
    client.GetMusicHighScores(request, requestMetadata, function(err, res) {
      if (!err) {
        resolve(res);
      } else {
        console.log(err);
        reject(err);
      }
    });
  });

  if (!response){
    return null;
  }

  return response.entries;
}

async function insertScoresIntoDb(chart, scores) {
  const promises = scores.map(score => {
    return new Promise((resolve, reject) => {
      let hash = getHash(chart, score);
      let acc = score.score / 10000;
      let stats_uni = getRatingStats(acc, chart.const_uni);
      let stats_unip = getRatingStats(acc, chart.const_unip);
      let stats_fes = getRatingStats(acc, chart.const_fes);
      let stats_fesp = getRatingStats(acc, chart.const_fesp);
      let stats_bud = getRatingStats(acc, chart.const_bud);
      let stats_budp = getRatingStats(acc, chart.const_budp);

      let query = `INSERT INTO mythos_scores (hash, user_id, user_name, chart_hash, ap_count, accuracy, rating_uni, rating_unip, rating_fes, rating_fesp, rating_bud, rating_budp, date_unix) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(hash) DO UPDATE SET user_id = ?, user_name = ?, chart_hash = ?, ap_count = ?, accuracy = ?, rating_uni = ?, rating_unip = ?, rating_fes = ?, rating_fesp = ?, rating_bud = ?, rating_budp = ?, date_unix = ?`;

      let params = [hash, score.api_id, score.user_name, chart.hash, score.total_all_perfect_plus, acc, stats_uni.rating, stats_unip.rating, stats_fes.rating, stats_fesp.rating, stats_bud.rating, stats_budp.rating, score.user_play_date,
      score.api_id, score.user_name, chart.hash, score.total_all_perfect_plus, acc, stats_uni.rating, stats_unip.rating, stats_fes.rating, stats_fesp.rating, stats_bud.rating, stats_budp.rating, score.user_play_date];

      db.run(query, params, function(e) {
        if (e) {
          console.error(`[MYHOS_FETCH]: FAILED to process mythos score: ${e.message}`, e);
          reject(e);
        } else {
          resolve();
        }
      });
    });
  });

  await Promise.all(promises);
}

function getHash(chart, score){
  return `${score.api_id}-chart:${chart.id}`;
}

function initializeMythos() {
	const proto = handleApiCalls("leaderboard");

	try {
		client = new proto.MaimaiLeaderboard(Secrets.MYTHOS, grpc.credentials.createSsl());
    console.log("[MYHOS_FETCH]: Successfully connected to Mythos API.");
	} catch {
    console.log("[MYHOS_FETCH]: Error connecting to Mythos API.");
		return;
	}
}

async function processMythosScores(){
  console.log("[MYHOS_FETCH]: Getting scores from mythos ...");

  initializeMythos();

  console.log("[MYHOS_FETCH]: Fetching charts...");
  const chartsQuery = `SELECT * FROM charts ORDER BY const_bud DESC`;
  let charts = await new Promise((resolve, reject) => {
    db.all(chartsQuery, (e, charts) => {
      if (e) {
        console.log("[LOAD_OLD_SCORES]: Failed to load scores.");
        reject(e);
      } else {
        resolve(charts);
      }
    });
  });

  const args = process.argv.slice(2);
  let start_index = 0;
  if (args.length > 0){
    start_index = parseInt(args[0]);

    if (Number.isNaN(start_index)) {
      start_index = 0;
    }

    console.log(`[MYHOS_FETCH]: Start index found: <[${start_index}]> ...`);
  }

  for (i = start_index; i < charts.length; i++) {
    const chart = charts[i];

    let scores = await getScoresFromMythos(chart);
    await new Promise(resolve => setTimeout(resolve, 400)); // Delay

    if (scores == null) {
      console.log(`[MYHOS_FETCH]: Failed to fetch scores for [${i}] ${chart.title}`);
      continue;
    }

    await insertScoresIntoDb(chart, scores);

    console.log(`[MYHOS_FETCH]: [${i}/${charts.length}] Fetched ${scores.length} scores for ${chart.title} - ${chart.difficulty}-${chart.const_bud}`);
  }
}

processMythosScores();
