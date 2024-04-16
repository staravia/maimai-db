const Sqlite3 = require("sqlite3");
const db = new Sqlite3.Database('./maimai-db.db');

async function Test(){
  let query = `WITH Test AS (SELECT user_name AS user_id, chart_hash FROM mythos_scores) SELECT * FROM Test WHERE user_id = 'ＢＲＩＡＮ＊ＩＺ'`;
  let results = await new Promise ((resolve, reject) => {
    db.all(query, (e, charts) => {
      if (e) {
        console.log("[LOAD_OLD_SCORES]: Failed to load scores.");
        reject(e);
      } else {
        resolve(charts);
      }
    });
  });

  console.log(results);
}

Test();
