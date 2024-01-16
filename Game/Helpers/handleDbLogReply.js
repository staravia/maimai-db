const { EmbedBuilder } = require('discord.js');

function handleDbLogReply(description, msg, game){
	if (game.debug){
		description.replace(/\n\n$/, "");

		const embed = new EmbedBuilder()
			.setTitle("🛠️ - Debug")
			.setColor(0x3333FF)
			.setDescription(`\`\`\`${description} \`\`\``);

		msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
	}
}

module.exports = handleDbLogReply;
