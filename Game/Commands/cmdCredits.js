const getIsDeveloper = require("./../Helpers/getIsAdmin.js");
const getSearchArguments = require("./../Helpers/getSearchArguments.js");
const getVersionAndUsers = require("./../Helpers/getVersionAndUsers.js");
const getDbLogString = require("./../Helpers/getDbLogString.js");
const getUserAsync = require("./../Helpers/getUserAsync.js");
const handleDbLogReply = require("./../Helpers/handleDbLogReply.js");
const { MembershipStatus, Commands, ParameterType } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdCredits(game, msg){
	var admin = getIsDeveloper(msg);
  let args = getSearchArguments(msg.content);
  let userParams = getVersionAndUsers(game, args);
	let count = 0;
	let clear =  msg.content.indexOf("clear") > 0;
	let user_id = msg.author.id;

	if (args.length > 0){
		args.forEach(arg => {
			if (arg.type == ParameterType.COUNT){
				count = arg.value;
			}
		});
	}

	if (userParams.users.length > 0){
		user_id = userParams.users[0];
	}

	if (count > 0 || clear == true){
		if (!admin) {
			msg.reply({content: `You are not a developer. Only developers may give Kumakult credits.`, allowedMentions: {repliedUser: false}});
			msg.react('❌');
			return;
		}
	}

	let profile = await new Promise((resolve, reject) => {
		game.db.all(`SELECT * FROM users WHERE id = ${user_id}`, (e, profiles) => {
			if (e) {
				console.error(`[SCORE]: FAILED to grab user profile: ${msg.author} - ${user_id} - ${count}`, e);
				resolve(null);
			} else {
				if (profiles.length == 0){
					resolve(null);
				} else {
					resolve(profiles[0]);
				}
			}
		});
	});

	if (profile == null){
		msg.reply({content: `Error. Cannot find user.`, allowedMentions: {repliedUser: false}});
		msg.react('❌');
		return;
	}

	let user = await getUserAsync(game, user_id);
	let status = MembershipStatus.NONE;
	let credits = profile.credits == null ? 0 : profile.credits;

	switch (profile.status) {
		case MembershipStatus.NONE.id:
			status = MembershipStatus.NONE;
			break;
		case MembershipStatus.BASIC.id:
			status = MembershipStatus.BASIC;
			break;
		case MembershipStatus.PRIORITY.id:
			status = MembershipStatus.PRIORITY;
			break;
		case MembershipStatus.BANNED.id:
			status = MembershipStatus.BANNED;
			break;
	}

	if (count == 0 && clear == false){
		const embeda = new EmbedBuilder()
			.setTitle(`🔺 - ${user}'s Kumakult Profile`)
			.setDescription(`Viewing \`${user}'s\` Kumakult profile.\n- Status: \`${status.label} ${status.suffix}\`\n- Credits: \`${credits} 🔺\``)
			.setFooter({text: "Credits 🔺 allow you to book the cab to yourself."});

		msg.reply({ embeds: [embeda], allowedMentions: { repliedUser: false }});
		return;
	}

	if (clear){
		count = -credits;
		credits = 0;
	} else {
		credits += count;
	}

  let query = `INSERT INTO users (id, credits) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET credits = ?`;
  let params = [user_id, credits, credits];
  let queryLog = getDbLogString(query, params, Commands.STATUS.log_string);
	let result = await new Promise((resolve, reject) => {
		game.db.run(query, params
			, function(e) {
			if (e) {
				console.error(`[SCORE]: FAILED to update user credits: ${msg.author} - ${user_id} - ${credits}`, e);
			} else {
				resolve(true);
			}
		});
	});

  const embed = new EmbedBuilder()

	if (result){
		let description = `Successfully updated \`${user}'s\` credits! **Only developers may give credits.**\n- Status: \`${status.label} ${status.suffix}\`\n- Credits: \`${credits} 🔺 `;

		if (count >= 0){
			description += `(+${count})\``;
		} else {
			description += `(${count})\``;
		}

		msg.react('✅');
    embed.setTitle(`🔺 - ${user}'s Kumakult Profile`)
    embed.setDescription(description);
		embed.setFooter({text: "Credits 🔺 allow you to book the cab to yourself."});
	} else {
    embed.setTitle("🔺 - Credits ⚠️")
    embed.setColor(0xCC3333)
		embed.setDescription(`⚠️ Failed to update status in the database.\n\n${description}`);
		msg.react('❌');
	}

	handleDbLogReply(queryLog, msg, game);
	msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
}

module.exports = cmdCredits;
