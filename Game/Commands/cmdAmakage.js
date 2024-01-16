const YouTubeSearch = require('youtube-search');
const Secrets = require("./../Secrets/secrets.js");
const { Constants } = require("./../constants.js");

function cmdAmakage(msg){
	const searchQuery = msg.content.substring(Constants.Prefix.length).toLowerCase().replace('amakage ', '');
	const opts = {
	  maxResults: 1,
	  key: Secrets.API_KEY,
	  channelId: 'UCC_iD2pY80sjA0sZIi8Ym4g'
	};

	YouTubeSearch(searchQuery, opts, (err, results) => {
	  if (err) {
	    console.error('Error:', err);
	    return;
	  }

	  if (results.length > 0) {
	    const bestMatch = results[0];
	    msg.reply({content: `I've found something! ${bestMatch.link}`, allowedMentions: { repliedUser: false }});
	  } else {
	    msg.reply({content: `I cannot find any videos with this search parameter: \`${searchQuery}\``, allowedMentions: { repliedUser: false }});
	  }
	});
}

module.exports = cmdAmakage;
