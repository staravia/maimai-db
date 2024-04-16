async function handleInitDatabaseAsync(db) {
  const createUsersQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT UNIQUE PRIMARY KEY,
			alias TEXT,
			color TEXT,
			status INTEGER,
			credits INTEGER,
      scores_submitted INTEGER,
      rating_uni REAL,
      rating_unip REAL,
      rating_fes REAL,
      rating_fesp REAL,
      rating_bud REAL,
      rating_budp REAL,
      count_uni REAL,
      count_unip REAL,
      count_fes REAL,
      count_fesp REAL,
      count_bud REAL,
      count_budp REAL
    )`;

  const createGuildsQuery = `
    CREATE TABLE IF NOT EXISTS guilds (
      id TEXT UNIQUE PRIMARY KEY,
      db_channel_id TEXT,
      scores_channel_id TEXT,
      game_version INTEGER,
      international_version BOOLEAN
    )`;

  const createScoresQuery = `
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT UNIQUE,
      user_id TEXT,
      chart_hash TEXT,
      accuracy REAL,
      rating_uni REAL,
      rating_unip REAL,
      rating_fes REAL,
      rating_fesp REAL,
      rating_bud REAL,
      rating_budp REAL,
      message_url TEXT,
      date_unix TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (chart_hash) REFERENCES charts(hash)
    )`;

  const createMythosScoresQuery = `
    CREATE TABLE IF NOT EXISTS mythos_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT UNIQUE,
      user_id TEXT,
      user_name TEXT,
      chart_hash TEXT,
      ap_count INTEGER,
      accuracy REAL,
      rating_uni REAL,
      rating_unip REAL,
      rating_fes REAL,
      rating_fesp REAL,
      rating_bud REAL,
      rating_budp REAL,
      date_unix TEXT
    )`;

  const createChartsQuery = `
    CREATE TABLE IF NOT EXISTS charts (
      hash TEXT UNIQUE PRIMARY KEY,
      id INTEGER,
      dx_version INTEGER,
      is_locked BOOLEAN,
      is_international BOOLEAN,
      is_china BOOLEAN,
      title STRING,
      artist STRING,
			notes_designer STRING,
      category INTEGER,
      game_version INTEGER,
      difficulty INTEGER,
      const_uni DECIMAL,
      const_unip DECIMAL,
      const_fes DECIMAL,
      const_fesp DECIMAL,
      const_bud DECIMAL,
      const_budp DECIMAL,
			count_taps INTEGER,
      count_holds INTEGER,
      count_slides INTEGER,
      count_touch INTEGER,
      count_break INTEGER,
      count_total INTEGER,
      tags INTEGER,
			bpm DECIMAL,
      image_file STRING,
      search_title STRING)`;

  return await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(createUsersQuery, (err) => {
        if (err) {
          console.error('[INIT]: Error initializing USERS table:', err);
          reject(err);
        } else {
          console.log('[INIT]: USERS database initialized!');
        }
      });

      db.run(createScoresQuery, (err) => {
        if (err) {
          console.error('[INIT]: Error initializing SCORES table:', err);
          reject(err);
        } else {
          console.log('[INIT]: SCORES database initialized!');
        }
      });

      db.run(createGuildsQuery, (err) => {
        if (err) {
          console.error('[INIT]: Error initializing GUILDS table:', err);
          reject(err);
        } else {
          console.log('[INIT]: GUILDS database initialized!');
        }
      });

      db.run(createChartsQuery, (err) => {
        if (err) {
          console.error('[INIT]: Error initializing CHARTS table:', err);
          reject(err);
        } else {
          console.log('[INIT]: CHARTS database initialized!');
        }

        resolve();
      });

      db.run(createMythosScoresQuery, (err) => {
        if (err) {
          console.error('[INIT]: Error initializing MYTHOS_SCORES table:', err);
          reject(err);
        } else {
          console.log('[INIT]: MYTHOS_SCORES database initialized!');
        }

        resolve();
      });
    });
  });
}

module.exports = handleInitDatabaseAsync;
