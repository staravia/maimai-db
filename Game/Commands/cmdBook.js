const Secrets = require("./../Secrets/secrets.js");
const sheetName = 'database';
const getSearchArguments = require("./../Helpers/getSearchArguments.js");
const getUserAsync = require("./../Helpers/getUserAsync.js");
const getDbLogString = require("./../Helpers/getDbLogString.js");
const handleDbLogReply = require("./../Helpers/handleDbLogReply.js");
const getIsDeveloper = require("./../Helpers/getIsDeveloper.js");
const handlePageButtons = require("./../Helpers/handlePageButtons.js");
const { Months, Days, Commands, Constants, ParameterType, GameVersion, SearchArgs, BookingType, MembershipStatus } = require("./../constants.js");
const { IntentsBitField, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType } = require('discord.js');
const { google } = require('googleapis');
const kumakult_url = `https://www.kumakult.com/schedule`
const footer_text = `You must have priority or credits in order to book.\nPlease limit bookings from sun-thurs (11am-9pm).`;

async function cmdBook(game, msg, increment = 0, cache = null){
  if (cache == null){
    let your_bookings = [];
    let total_bookings = 0;
    let conflicts_found = false;
    let data_updated = false;
    let conflicts = [];
    let booking_description = ``;
    let bookings = [];

    cache = new SearchArgs();
		cache.command = Commands.BOOK;
		cache.page = 0;
		cache.user_id = msg.author.id;
		game.requestsCache[msg.author.id] = cache;

    const isDeveloper = getIsDeveloper(msg);
    const user_id = msg.author.id;
    const currentBooking = await getBookingAsync(game, msg);
    console.log(`[CMD_BOOK]: Trying to Authorize Google Sheets API...`);
    await game.google.authorize();
    const sheets = google.sheets({
      version: 'v4',
      auth: game.google
    });
    bookings = await getCurrentBookingsAsync(game, msg, sheets);
    console.log(`[CMD_BOOK]: Successfully Authorized Google Sheets API...`);

    if (currentBooking == "ignore"){
      return;
    }

    if (currentBooking != null && currentBooking.booking_type.id != BookingType.CANCELLED.id){
      bookings.push(currentBooking);
    }

    bookings.sort((a, b) => {
      return a.start - b.start;
    });

    // Get conflicts
    bookings.forEach(booking => {
      if (booking.booking_type.id != BookingType.CANCELLED.id){
        if (booking.user_id == user_id && booking != currentBooking){
          total_bookings++;
          your_bookings.push(booking);
        } if (currentBooking != null && booking != currentBooking){
          let conflict = isBookingsOverlapping(currentBooking, booking);
          if (conflict){
            conflicts.push(booking)
          }
        }
      }
    });

    // Get Profile
    let profile = await new Promise((resolve, reject) => {
      game.db.all(`SELECT * FROM users WHERE id = ${user_id}`, (e, profiles) => {
        if (e) {
          console.error(`[SCORE]: FAILED to grab user profile: ${user_id}`, e);
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
      msg.react(`❌`);
      msg.reply({content: 'ERROR: Failed to find user in database.', allowedMentions: { repliedUser: false }});
      return;
    }

    let credits = profile.credits == null || profile.credits == undefined ? 0 : parseInt(profile.credits);
    let isPriority = parseInt(profile.status) == MembershipStatus.PRIORITY.id;

    // Handle Booking
    if (currentBooking != null){
      if (currentBooking.booking_type.id == BookingType.CANCELLED.id) {
        booking_description = `### Cancelled Booking ${BookingType.CANCELLED.prefix}`;
        if (conflicts.length == 0){
          conflicts_found = true;
          booking_description += `⚠️\n**Sorry, no booking was found with your parameters.**\n- ${getBookingDescription(currentBooking, true)}\n`;
        } else {
          let cancelled_booking = null;
          conflicts.forEach(conflict => {
            if (conflict.start.getDate() == currentBooking.start.getDate()
            && conflict.start.getHours() == currentBooking.start.getHours()){
              if (isDeveloper || conflict.user_id == currentBooking.user_id){
                cancelled_booking = conflict;
              }
            }
          });

          if (cancelled_booking != null){
            booking_description += `\nThis booking has been cancelled.\n- ${getBookingDescription(cancelled_booking, true)}\n`;

            const indexToRemove = bookings.findIndex(booking => booking == cancelled_booking);
            if (indexToRemove !== -1) {
              bookings.splice(indexToRemove, 1);
            }

            console.log(`[CMD_BOOK]: Updating Google Sheets...`);
            try {
              let data = [ currentBooking.start, currentBooking.duration, BookingType.CANCELLED.id, currentBooking.booker, currentBooking.user_id, currentBooking.message ];
              await sheets.spreadsheets.values.update({
                  auth: game.google,
                  spreadsheetId: Secrets.SCHEDULE_ID,
                  range: `${sheetName}!A${cancelled_booking.row_index}:Z${cancelled_booking.row_index}`,
                  valueInputOption: "USER_ENTERED",
                  resource : {
                      values: [data]
                  }
              });
            } catch (e){
              msg.react(`❌`);
              msg.reply({content: `Error: \`${e}\``, allowedMentions: { repliedUser: false }});
              return;
            }
            console.log(`[CMD_BOOK]: SUCCESS in updating Google Sheets!`);

            if (total_bookings >= 2 && !isDeveloper){
              credits ++;
              booking_description += `\n**A credit has been refunded.**\n- Total credits remaining: \`${credits} 🔺 (+1)\`\n`;

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

              handleDbLogReply(queryLog, msg, game);
            }

            data_updated = true;
            msg.react(`✅`);
          } else {
            conflicts_found = true;
            booking_description += `⚠️ \n**Sorry, no booking was found with your parameters.**\n- ${getBookingDescription(currentBooking, true)}\n\nCould it be any one of these? You can only cancel your own bookings.\n`;
            conflicts.forEach(conflict => {
              let detail = getBookingDescription(conflict);
              booking_description += `- ${detail}\n`
            });
          }
        }
      } else if (conflicts.length > 0){
        conflicts_found = true;
        booking_description = `### Your Booking (Conflict) ⚠️\n`
        booking_description += `- ${getBookingDescription(currentBooking, true)}\n`;
        booking_description += `**There overlapping schedules with your booking.** Please look below.\n`;
        conflicts.forEach(conflict => {
          let detail = getBookingDescription(conflict);
          booking_description += `- ${detail}\n`
        });
      } else {
        let credit_consumed = false;
        let your_bookings_description = ``;
        your_bookings.forEach(booking => {
          your_bookings_description += `- ${getBookingDescription(booking, true)}\n`
        })

        if (!isDeveloper && !isPriority) {
          if (total_bookings < 2){
            if (credits == 0){
              const embed = new EmbedBuilder()
                .setTitle("📆 Schedule ⚠️") // TODO: CLEAN
                .setColor(0xCC3333)
                .setURL(kumakult_url)
                .setDescription(`### You have no credits.\nYou need credits for a booking.\n- Your credits: \`${credits} 🔺\``)
                .setFooter({text: footer_text});

              msg.react(`❌`);
              msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
              return;
            }
          } else if (total_bookings >= 2) {
            const embed = new EmbedBuilder()
              .setTitle("📆 Schedule ⚠️") // TODO: CLEAN
              .setColor(0xCC3333)
              .setURL(kumakult_url)
              .setDescription(`### You cannot have more than 2 active bookings.\nYour bookings are listed below.\n${your_bookings_description}\n**Cancel one of your current bookings for a credit refund.**\n- Your credits: \`${credits} 🔺\``)
              .setFooter({text: footer_text});

            msg.react(`❌`);
            msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
            return;
          }

          credits --;
          credit_consumed = true;
        } else if (!isDeveloper && isPriority){
          if (total_bookings == 1){
            if (credits == 0){
              const embed = new EmbedBuilder()
                .setTitle("📆 Schedule ⚠️") // TODO: CLEAN
                .setColor(0xCC3333)
                .setURL(kumakult_url)
                .setDescription(`### You have no credits.\nYou need credits for another booking. Your current booking is listed below.\n${your_bookings_description}\n- Your credits: \`${credits} 🔺\``)
                .setFooter({text: footer_text});

              msg.react(`❌`);
              msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
              return;
            }
            credits --;
            credit_consumed = true;
          } else if (total_bookings >= 2) {
            const embed = new EmbedBuilder()
              .setTitle("📆 Schedule ⚠️") // TODO: CLEAN
              .setColor(0xCC3333)
              .setURL(kumakult_url)
              .setDescription(`### You cannot have more than 2 active bookings.\nYour bookings are listed below.\n${your_bookings_description}\n**Cancel one of your current bookings for a credit refund.**\n- Your credits: \`${credits} 🔺\``)
              .setFooter({text: footer_text});

            msg.react(`❌`);
            msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
            return;
          }
        }

        let month_label = `???`;
        let timeLabel = currentBooking.start.toLocaleTimeString('en-US', {
          hour: 'numeric', // Numeric hour (12-hour clock)
          minute: '2-digit', // Two-digit minute
          hour12: true, // Use 12-hour clock
        });
        let month_id = currentBooking.start.getMonth();
        Object.values(Months).forEach(month => {
          if (month.id == month_id){
            month_label = month.label.toLowerCase();
          }
        });
        booking_description = `### New Booking\n`;
        booking_description += `\nYou have successfully booked a timeslot for the cab. Be sure to show up! Use \`${Constants.Prefix}book cancel ${month_label} ${currentBooking.start.getDate()} ${timeLabel.toLowerCase().replace(':00 ', '')}\` to cancel the current booking.\n`
        booking_description += `- ${getBookingDescription(currentBooking, true)}\n`;

        if (credit_consumed){
          booking_description += `\n**A credit has been consumed.**\n- Total credits remaining: \`${credits} 🔺 (-1)\`\n`;

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

          handleDbLogReply(queryLog, msg, game);
        }

        // Calculate the difference in milliseconds
        const now = getPdtOffset(new Date());
        const differenceInMilliseconds = currentBooking.start.getTime() - now.getTime();
        const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);

        if (differenceInDays < 5 && !isDeveloper){
          const embed = new EmbedBuilder()
            .setTitle("📆 Schedule ⚠️") // TODO: CLEAN
            .setColor(0xCC3333)
            .setURL(kumakult_url)
            .setDescription(`### You must book at least 5 days (120 hours) in advance.\n- ${getBookingDescription(currentBooking, true)}\n- Your credits: \`${credits} 🔺\``)
            .setFooter({text: footer_text});

          msg.react(`❌`);
          msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
          return;
        }

        try {
          await saveBookingAsync(game, msg, sheets, currentBooking);
        } catch(e) {
          msg.react(`❌`);
          msg.reply({content: `Error: \`${e}\``, allowedMentions: { repliedUser: false }});
        }

        data_updated = true;
        msg.react(`✅`);
      }
    }

    cache.booking_description = booking_description;
    cache.currentBooking = currentBooking;
    cache.conflicts_found = conflicts_found;
    cache.bookings = bookings;
    cache.data_updated = data_updated;
    cache.your_bookings = your_bookings;
  }

  // Get description
  let last_page = Math.floor(cache.bookings.length / Constants.DefaultSmallPageSize);
  if (cache.bookings.length % Constants.DefaultSmallPageSize == 0 && cache.bookings.length > 0){
    last_page --;
  }
  cache.page += increment;
  cache.page = Math.min(last_page, Math.max(0, cache.page));

  let description = ``;
  if (cache.your_bookings.length > 0){
    description += `### Your Current Bookings\n`;
    const max_your_bookings = 5;

    for (var i = 0; i < max_your_bookings && i < cache.your_bookings.length; i++){
      let booking = cache.your_bookings[i];
      if (booking.booking_type.id != BookingType.CANCELLED.id){
        let detail = getBookingDescription(booking, cache.currentBooking == booking);
        description += `${i+1}. ${detail}\n`;
      }
    }

    if (cache.your_bookings.length > max_your_bookings){
      description += `And ${cache.your_bookings.length - max_your_bookings} more bookings found ...\n`;
    }
  }

  description += `### All Active Bookings\n`;
  if (cache.bookings.length == 0){
    description += `No bookings found.\n`;
  }

  for (var i = 0; i < Constants.DefaultSmallPageSize; i++){
    var index = i + cache.page * Constants.DefaultSmallPageSize;
    if (index >= cache.bookings.length){
      break;
    }

    let booking = cache.bookings[index];
    if (booking.booking_type.id != BookingType.CANCELLED.id){
      let detail = getBookingDescription(booking, cache.currentBooking == booking);
      description += `${index+1}. ${detail}\n`;
    }
  }

  description = `${cache.booking_description}${description}`

  const embed = new EmbedBuilder()
    .setDescription(description)
    .setURL(kumakult_url)
    .setFooter({text: `${footer_text}\nPage ${cache.page + 1} / ${last_page + 1}`});

  let title = ``;
  if (last_page > 0){
    title = `📆 Schedule 📖 ${cache.page + 1} / ${last_page + 1}`;
  } else {
    title = `📆 Schedule`;
  }

  if (cache.conflicts_found){
    title += ` ⚠️`
    embed.setColor(0xCCCC33)
  } else if (cache.data_updated){
    embed.setColor(0x33CC33);
  } else {
    embed.setColor(0xCCCCCC);
  }

  embed.setTitle(title);

  // let content = { embeds: [embed], files: [attachment], allowedMentions: { repliedUser: false }};
  let content = { embeds: [embed], allowedMentions: { repliedUser: false }};
	handlePageButtons(content, cache.page, last_page);

	if (cache.message == null){
		cache.message = msg;
		msg.reply(content);
	} else {
		msg.edit(content);
	}
}

async function saveBookingAsync(game, msg, sheets, booking){

  let data = [ booking.start, booking.duration, booking.booking_type.id, booking.booker, booking.user_id, booking.message ];

  await sheets.spreadsheets.values.append({
      auth: game.google,
      spreadsheetId: Secrets.SCHEDULE_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: "USER_ENTERED",
      resource : {
          values: [ data ]
      }
  });
}

async function getCurrentBookingsAsync(game, msg, sheets){
  const range = `${sheetName}!A2:Z`;
  const now = Date.now();
  const current = new Date(now);
  current.setHours(0);
  current.setMinutes(0);

  let charts = [];
  let count = 0;
  let response = await sheets.spreadsheets.values.get(
    {
      spreadsheetId: Secrets.SCHEDULE_ID,
      range: range,
    }
  );

  let results = [];

  response.data.values.forEach((row, index) => {
    const [date, duration, type, booker, user_id, notes] = row;
    if (row != null && date != undefined && duration != undefined) {
      try {
        let start = new Date(date);
        let parsedDuration = parseInt(duration);
        let booking_type = parseInt(type);
        let result = getStartAndEndDate(index + 2, user_id, start, parsedDuration, booker, booking_type, notes);

        if (result.start > current && booking_type != BookingType.CANCELLED.id){
          results.push(result);
        }
      } catch (e){
        console.error(e);
      }
    }
  });

  return results;
}

async function getBookingAsync(game, msg){
  const isDeveloper = getIsDeveloper(msg);
  const args = getSearchArguments(msg.content);
  let month = null;
  let weekday = null;
  let day = 0;
  let time = 0;
  let duration = 0;
  let nextFound = false;
  let today = false;
  let tomorrow = false;
  let booker = msg.author.username;
  let message = "";
  let type = BookingType.NONE.id;
  let user_id = null;

  if (args.length == 0)
  {
    return null;
  }

  args.forEach(arg => {
    switch (arg.type) {
      case ParameterType.MONTH:
        month = arg.value;
      break;
      case ParameterType.DAY:
        weekday = arg.value;
      break;
      case ParameterType.TIME:
        time = arg.value;
      break;
      case ParameterType.CONSTANT:
        day = Math.floor(arg.value);
      break;
      case ParameterType.DURATION:
        duration = arg.value;
      break;
      case ParameterType.USERID:
      if (isDeveloper){
        user_id = arg.value;
      }
      break;
      case ParameterType.BOOKINGTYPE:
        if (isDeveloper){
          type = arg.value.id;
        } else if (arg.value.id == BookingType.CANCELLED.id) {
          type = arg.value.id;
        }
      break;
      case ParameterType.SEARCH:
        let str = arg.value.toLowerCase();
        if (str == "next"){
          nextFound = true;
        } else if (str == "today" || str == "td"){
          today = true;
        } else if (str == "tomorrow" || str == "tmrw" || str == "tm"){
          tomorrow = true;
        } else {
          message = str;
        }
      break;
    }
  });

  if (user_id != null){
    booker = await getUserAsync(game, user_id);
  } else {
    user_id = msg.author.id;
  }

  let now = Date.now();
  let currentDate = new Date(now);
  let targetDate = new Date();

  if (!isDeveloper && time <= 0 && type != BookingType.CANCELLED.id){
    const embed = new EmbedBuilder()
      .setTitle("📆 Schedule ⚠️") // TODO: CLEAN
      .setColor(0xCC3333)
      .setURL(kumakult_url)
      .setDescription(`**Invalid booking. Please enter a time.**`)
      .setFooter({text: footer_text});

    msg.react(`❌`);
    msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
    return "ignore";
  }

  if (!isDeveloper && duration <= 0){
    duration = 3;
  } else if (time <= 0 && duration <= 0){
    duration = 24;
  } else if (duration == 0){
    duration = 3
  }

  if (today) {
    let today = new Date();
    targetDate = getPdtOffset(today, true);
  } else if (tomorrow) {
    let today = new Date();
    targetDate = getPdtOffset(today, true);
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (day > 0 && month != null) {
    targetDate.setMonth(month.id);
    targetDate.setDate(day);
    if (targetDate < currentDate) {
      targetDate.setFullYear(targetDate.getFullYear() + 1);
    }
  } else if (weekday != null){
    let currentDay = currentDate.getDay();
    let daysUntil = (weekday.id + 7 - currentDay) % 7;
    if (daysUntil == 0){
      daysUntil += 7;
    } if (nextFound){
      daysUntil += 7;
    }

    targetDate = new Date(now + daysUntil * 24 * 60 * 60 * 1000);
  } else {
    const embed = new EmbedBuilder()
      .setTitle("📆 Schedule ⚠️") // TODO: CLEAN
      .setColor(0xCC3333)
      .setURL(kumakult_url)
      .setDescription(`**Invalid booking. Day or month is invalid.**`)
      .setFooter({text: footer_text});

    msg.react(`❌`);
    msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
    return "ignore";
  }

  if (targetDate < now){
    const embed = new EmbedBuilder()
      .setTitle("📆 Schedule ⚠️") // TODO: CLEAN
      .setColor(0xCC3333)
      .setURL(kumakult_url)
      .setDescription(`**Invalid booking. Date has already passed.**`)
      .setFooter({text: footer_text});

    msg.react(`❌`);
    msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
    return "ignore";
  }

  targetDate.setHours(time, 0, 0, 0);
  return getStartAndEndDate(-1, user_id, targetDate, duration, booker, type, message);
}

function getStartAndEndDate(row_index, user_id, date, duration, booker, type = 0, message = ""){
  let booking_type = BookingType.NONE;
  let endDate = new Date(date);
  let getHours = date.getHours();
  let totalHours = getHours + duration;
  if (totalHours >= 24) {
    endDate.setDate(date.getDate() + Math.floor(totalHours / 24));
  }

  Object.values(BookingType).forEach(b => {
    if (b.id == type){
      booking_type = b;
    }
  });

  endDate.setHours(totalHours % 24);
  return { row_index: row_index, start: date, end: endDate, duration: duration, message: message, booker: booker, user_id: user_id, booking_type: booking_type};
}

function isBookingsOverlapping(booking1, booking2) {
  const start1 = new Date(booking1.start);
  const end1 = new Date(booking1.end);
  const start2 = new Date(booking2.start);
  const end2 = new Date(booking2.end);

  return (
    (start1 < end2 && end1 > start2) ||
    (start2 < end1 && end2 > start1)
  );
}

function getBookingDescription(booking, timestamp = false){
  // let start = `${Math.floor(booking.start/1000)}`;
  // let end = `${Math.floor(booking.end/1000)}`;
  // start.replace(`.0`, ``);
  // end.replace(`.0`, ``);

  const day = booking.start.getDay();
  const xm = booking.end.getDay() != day;
  const startTime = getTimeDescription(booking.start);
  const endTime = getTimeDescription(booking.end, xm);
  const formattedDate = booking.start.toLocaleDateString('en-US', {
    month: 'short', // Abbreviated month name (e.g., "Nov")
    day: 'numeric', // Day of the month (e.g., "12")
    weekday: 'long', // Full day name (e.g., "Friday")
  });

  let dayPrefix = ``;
  Object.values(Days).forEach(d => {
    if (d.id == day){
      dayPrefix = d.prefix;
    }
  });

  let typePrefix = ``;
  if (booking.booking_type.id != BookingType.NONE.id){
    typePrefix = `${booking.booking_type.prefix} ${booking.booking_type.label}`;
  }

  let description = ``;
  if (booking.booking_type.id == BookingType.CANCELLED.id){
    if (booking.duration >= 24){
      description = `\`${dayPrefix} ${formattedDate}\`  Time: \`📆 ${formattedDate}\``;
    } else {
      description = `\`${dayPrefix} ${formattedDate}\`  Time: \`${startTime}\``;
    }
  } else if (booking.duration >= 24){
    let endDate = new Date(booking.end);
    endDate.setDate(endDate.getDate() - 1);
    const formattedEndDate = endDate.toLocaleDateString('en-US', {
      month: 'short', // Abbreviated month name (e.g., "Nov")
      day: 'numeric', // Day of the month (e.g., "12")
      weekday: 'long', // Full day name (e.g., "Friday")
    });
    if (booking.duration == 24){
      description = `\`${dayPrefix} ${formattedDate}\`  Time: \`📆 ${formattedDate} (1 day)\`  By: \`${booking.booker}\``;
    } else {
      description = `\`${dayPrefix} ${formattedDate}\`  Time: \`📆 ${formattedDate}\` - \`📆 ${formattedEndDate} (${Math.floor(booking.duration/24)} days)\`  By: \`${booking.booker}\``;
    }
  } else {
    description = `\`${dayPrefix} ${formattedDate}\`  Time: \`${startTime}\` - \`${endTime} (${booking.duration}hr)\`  By: \`${booking.booker}\``;
  }

  let valid_message = booking.message != null && booking.message != "";
  if (booking.booking_type.id != BookingType.CANCELLED.id){
    if (typePrefix != `` || valid_message){
      description += `\n - `;
      if (typePrefix){
        description += `\`${typePrefix}\``;
        if (valid_message){
          description += `  Note: \`${booking.message}\``;
        }
      } else if (valid_message){
        description += `  Note: \`${booking.message}\``;
      }
    }
  }

  if (timestamp){
    const date = getPdtOffset(booking.start);
    const pacificEpochTime = date.getTime();
    let start = `${Math.floor(pacificEpochTime / 1000)}`;
    start.replace(`.0`, ``);
    description = `<t:${start}:R> 🆕  ${description}`;
  }

  return description;
}

function getPdtOffset(date, inverse){
  const utcDate = new Date(date);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let pacificOffset = 0;
  if (inverse){
    pacificOffset = 0;
    // pacificOffset = timeZone == "UTC" ? -24 + 8 : 0;
  } else {
    pacificOffset = timeZone == "UTC" ? 8 : 0;
  }

  utcDate.setHours(utcDate.getHours() + pacificOffset);
  return utcDate;
}

function getTimeDescription(date, xm = false) {
  const hours = date.getHours();
  const isDay = hours >= 7 && hours < 19;
  let time = date.toLocaleTimeString('en-US', {
    hour: 'numeric', // Numeric hour (12-hour clock)
    minute: '2-digit', // Two-digit minute
    hour12: true, // Use 12-hour clock
  });

  if (xm){
    let output = (`🌑 ${time.toLowerCase()}`).replace('AM', 'XM').replace('PM', 'XM');
    return output;
  } else if (isDay){
    return `☀️ ${time.toLowerCase()}`;
  } else if (!xm) {
    return `🌙 ${time.toLowerCase()}`;
  }
}

module.exports = cmdBook;
