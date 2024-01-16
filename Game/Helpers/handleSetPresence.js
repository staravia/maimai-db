const { ActivityType } = require('discord.js');
const { Constants } = require("./../constants.js");

function handleSetPresence(client, users){
  client.user.setPresence({
    activities: [{
        name: `${Constants.Prefix}help (${users} users)`,
        type: ActivityType.Playing,
    }],
    status: `${Constants.Prefix}help`
  });
}

module.exports = handleSetPresence;
