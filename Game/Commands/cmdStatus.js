const getIsDeveloper = require("./../Helpers/getIsAdmin.js");
const getSearchArguments = require("./../Helpers/getSearchArguments.js");
const getVersionAndUsers = require("./../Helpers/getVersionAndUsers.js");
const getDbLogString = require("./../Helpers/getDbLogString.js");
const getUserAsync = require("./../Helpers/getUserAsync.js");
const handleDbLogReply = require("./../Helpers/handleDbLogReply.js");
const { MembershipStatus, Commands } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');

async function cmdStatus(game, msg){
	var admin = getIsDeveloper(msg);
  let args = getSearchArguments(msg.content);
  let userParams = getVersionAndUsers(game, args);
	let user_id = userParams.users.length == 0 ? msg.author.id : userParams.users[0];

  if (userParams.users.length == 0){
    // const embeda = new EmbedBuilder()
    //   .setTitle("🌟 - Set Status ⚠️") // TODO: CLEAN
    //   .setColor(0xCC3333)
    //   .setDescription(`Invalid user.`);
		//
    // msg.reply({ embeds: [embeda], allowedMentions: { repliedUser: false }});
    // msg.react('❌');
    // return;
  }

  let str = msg.content.toLowerCase();
  let status = null;
  if (str.includes(MembershipStatus.NONE.search_title)){
    status = MembershipStatus.NONE;
  } else if (str.includes(MembershipStatus.BASIC.search_title)){
    status = MembershipStatus.BASIC;
  } else if (str.includes(MembershipStatus.PRIORITY.search_title)){
    status = MembershipStatus.PRIORITY;
  } else if (str.includes(MembershipStatus.BANNED.search_title)){
    status = MembershipStatus.BANNED;
  }

	let user = await getUserAsync(game, user_id);
  if (status == null){
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
			const embedb = new EmbedBuilder()
				.setTitle(`🌟 - Status ⚠️`)
				.setDescription(`Profile for user does not exist.`)
				.setFooter({text: "Credits 🔺 allow you to book the cab to yourself."})
				.setColor(0xCC3333);

			msg.reply({ embeds: [embedb], allowedMentions: { repliedUser: false }});
			msg.react('❌');
			return;
		}

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

		const embeda = new EmbedBuilder()
			.setTitle(`🔺 - ${user}'s Kumakult Profile`)
			.setDescription(`Viewing \`${user}'s\` Kumakult profile.\n- Status: \`${status.label} ${status.suffix}\`\n- Credits: \`${credits} 🔺\``)
			.setFooter({text: "Credits 🔺 allow you to book the cab to yourself."});

		msg.reply({ embeds: [embeda], allowedMentions: { repliedUser: false }});
    return;
  }

	if (!admin) {
		msg.reply({content: `You are not a developer. Only developers may set Kumakult status.`, allowedMentions: {repliedUser: false}});
		return;
	}

  // let user_id = userParams.users[0];
  let query = `INSERT INTO users (id, status) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET status = ?`;
  let params = [user_id, status.id, status.id];
  let queryLog = getDbLogString(query, params, Commands.STATUS.log_string);
	let result = await new Promise((resolve, reject) => {
		game.db.run(query, params
			, function(e) {
			if (e) {
				console.error(`[SCORE]: FAILED to update user status: ${msg.author} - ${user_id} - ${status}`, e);
			} else {
				resolve(true);
			}
		});
	});

  const embed = new EmbedBuilder()

	if (result){
		msg.react('✅');
    embed.setTitle("🌟 - Set Status")
    embed.setDescription(`Successfully updated \`${user}'s\` status! Only developers may use this command.\n- Status: \`${status.label} ${status.suffix}\``);
	} else {
    embed.setTitle("🌟 - Set Status ⚠️")
    embed.setColor(0xCC3333)
		embed.setDescription(`⚠️ Failed to update status in the database.\n\n${description}`);
		msg.react('❌');
	}

	handleDbLogReply(queryLog, msg, game);
	msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
}

module.exports = cmdStatus;
