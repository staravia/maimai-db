# Prerequisites
Ask `Wubbo` a.k.a staravia for the secret files. `Secrets.7z`

# Instructions
1. clone
1. cd into the directory and `npm install`
1. unzip `Secrets.7z` and put the contents into `/Game/Secrets/`
1. in `/Game/Secrets/secrets.js`, replace `CLIENT_TOKEN: '--------', // Main` with your own bot's key.
1. cd into the root directory and run `node Tools/backup-cloner.js` to set up the database. You'll have to do it once. The application will throw an error, but ignore that for now. `database.db` should be created.
1. To run the application, cd into the root directory and run `node index.js`
