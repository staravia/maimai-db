const vision = require('@google-cloud/vision');
const axios = require('axios');
const fs = require('fs');

const Secrets = require("./../Secrets/secrets.js");
const { DxVersion, GameVersion, Categories, Difficulties, Commands, ParameterBuilder, ParameterType, Tags, SearchArgs, Grades, Ranks } = require("./../constants.js");
const ignore_exact = ["sub-monitor", "moldov", "tap", "hold", "slide", "touch", "break", "onen", "☆(6.15 (u.1*", "critical", "perfect",
"nenor", "perfect", "www", "achievement", "great", "remote", "master", "do", "good", "450x3", "rating", "miss", "my best", "new record", "fast",
"25 c", "ver.dx1.30-1", "critical", "perfect", "perfect", "great", "good", "miss", "late", "スキップ", "hou", "cabinet", "lou", "sub", "-", "monitor", "moldov", "tap", "hold", "slide", "touch", "break", "(", "u.1",
"*", "critical", "perfect", "perfect", "achievement", "great", "master", "do", "good", "rating", "miss", "my best", "fast", "c", "ver.dx1.30-1", "critical", "perfect", "perfect", "great", "good", "miss", "my best", "my", "best", "late", "で", "スコア", "combo", "/", "cabinet", "lou", "achievement", "slears", "thad", "rating", "my best", "critical", "perfect", "perfect 313",
"max combo", "max sync", "slears", "lv", "new", "record", "my", "best", "achievement", "+", "critical", "perfect", "perfect", "great", "thad", "good", "max", "combo", "rating", "miss",
"sync", "es", "へ", "✰", "☆", "!", "e", ")", "cite", "dusezion", "s", "xb5", "credit", "ver.d", "ご", "注文", "は", "うさぎ", "ですか", "夢", "の", "終り", "新た", "な", "始まり", "nooo", "onitor", "€", "1st", "2nd", "3rd", "4th", "$", "re", ":", "re:", "orc", "σ", "fes", "号哭", "praturted", "gyunyu", ">", "cor", "phot", "we", "pict", "wedd", "u", "hhich", "s", "maimai", "你", "play like you", "✩", "ᄃ",
"must", "quace", "spot", "nythu", "hunt", "desk", "back", "quase", "while", "playwes", "spat", "placed", "nder", "under", "play", "初心者",
"eo se", "fully", "queue", "players", "laced", "will", "rules", "»", "t55kg",
"」", "€5:<", "75-7", "£", "で", "c5ok9", "つぎへ", "t55ks", "trav", "meniter", "て", "full", "thakg", "shwe perfect", "ritical", "thonetics", "chievement", "sheep-",
"masus", "food", "location", "gameplay", "machine", "include", "pleasel", "photos", "screen", "card", "playing", "mter",
"pair", "hardi", "inet", "t the back of the card", "aus, you must play as", "cards in the space spot.", "e queue, you can get", "and from the front desk)", "card at the back of the", "the queue while players", "laced in the #2 spot", "ard will be placed at the", "queue rules,", "(wy)", "achine", "cards", "space", "from", "front", "rules", "and", "regulations", "no", "public", "posting", "advertising", "of", "machine", "and", "its", "location", "no", "public", "posting", "of", "scores", "recorded", "gameplay", "private", "listed", "is", "acceptable", "when", "taking", "private", "photos", "of", "score", "machine", "do", "not", "include", "the", "game", "version", "online", "symbol", "in", "your", "photos", "please", "green", "symbol", "and", "version", "number", "at", "the", "stop", "of", "screen", "we", "highly", "recommend", "wearing", "gloves", "while", "playinh", "gloves", "are", "available", "at", "the", "front", "counter", "for", "$1", "a", "pair", "do", "not", "hit", "the", "buttons", "hard", "or", "tap", "swipe", "the", "touch", "screen", "hard", "do", "not", "step", "on", "put", "shoes", "on", "the", "cabinet", "please", "take", "extra", "care", "of", "the", "machine", "queue", "rules", "when", "you", "want", "to", "play", "place", "a", "card", "at", "the", "back", "of",
"the", "card", "queue", "behind", "the", "last", "card", "if", "there", "are", "4", "more", "more", "players", "in", "the", "queue", "you", "must", "play", "as", "a", "pair", "place", "both", "your", "cards", "in", "the", "space", "spot", "if", "you", "do", "not", "have", "a", "card", "to", "place", "in", "the", "queue", "you", "can", "get", "a", "placeholder", "ask", "for", "a", "placeholder", "card", "from", "the", "front", "desk", "when", "you", "finish", "your", "game", "place", "your", "card", "at", "the", "back", "of", "the", "line", "to", "queue", "up", "for", "another", "game", "please", "refrain", "from", "placing", "your", "card", "in", "the", "queue", "while", "players", "are", "mid-song", "wait", "until", "they", "finish", "expert", "basic", "novice", "carha", "t55k9", "comedy", "porcel", "hann gereect", "chlep", "re:master", "advanced", "basic", "re:", ":master",
"4544e", "や", "し", "心", "たい", "たり", "注意", "する", "と", "手", "力", "入れ", "先", "過ぎ", "ケガ", "なぞっ", "750kg", "ない", "credi",
"よう", "mapbberserecur", "、", "が", "あり", "ます", "により", "sega", "ませ", "ん", "卖家经涂九江学日", "nd photos & videos abue pusting", "恐れ", "に", "学", "日记", "を", "区", "。", "无", "休憩", "到", "品", "中", "取り", "ください", "た", "aeonsct", "yurusarenai", "chuce", "recono", "chetical", "gerfect", "perfect t",  "choc", "crea", "saky", "goud", "sury", "expert", "t5akg", "thucy", "max sy", "laut", "sare",
 "料金", "round", "プレイ", "いま", "出来", "投入", "追加", "場合", "れる", "お客様", "なっ", "際", "さ", "mainai",
  "achievemens", "door", "wymiot mookkioo", "fonat 15513", "art the",
  "golv", "dodocoge", "99.55.38", "estugas", "merfect", "16x337", "forens", "a 15363", "miss t",
  "spots", "sonttor", "20000md", "perpless", "maxcom4551", "touch 1271", "extrad", "cred lv 12*", "5><2",
  "bude", "waring", "focarecy", "derfree", "amat", "whethe", "touch the", "www.", "caution", "cering the", "oflector", "emsk)",
  "mily's", "gange", "couso", "t5209", "good b", "new recons",
  "mastere", "chce", "$22.00", "frations 15060",
  "subitor", "ofonissoo", "deeduar", "getay", "shwe pak",
  "safar", "wielder", "merer", "traction", "oned", "atron", "gued", "congo", "texck", "tr03", "roge", "slate", "quest", "stire", "phone:", "car de",
  "circl", "天", "feuse", "arevmey", "feuse f", "coll", "late", "early",
  "marto", "dunois", "riwin", "rident", "buden", "coc008800", "wymit", "delnin", "0.0000 delnin", "wurd",
  "“", "貧民", "大", "στ", "budow", "indon", "marsch",
  "#lik", "sonicon", "hsuvet", "bute", "cecausford", "pancy", "crdb", "child", "tai su", "555 w", "pancy 110 crdb", "happy", "xhet", "autres", "hotlucrury", "loui", "mama", "world", "this", "save", "joul", "rren", "8 por?", "critical perfect", "thot", "double 2. ich", "inu",
  "gredzer", "whee", "wonitor", "geed", "noncession", "gaute", "wymat", "promoter", "gatad", "gixd", "cred", "lik,25379"
];

const wacca_identifiers = ["rates", "r", "notes", "r notes", "missless", "missless!", "add", "add to", "to", "favorites", "reverse", "reverse points", "points", "earned", "title", "earned title", "title", "rp", "rate:", "ok", "rate :", "rate", "0000", "0001", "0002", "0003", "0004", "0005", "0006", "0007", "0008", "0009", "0010", "0011", "0012","0013","0014","0015","0016","0017","0018","0019","0020","0021","0022","0023","0024", "000.0%", "000.1%", "000.2%", "000.3%", "000.4%", "000.5%", "000.6%"];

const ignore_contains = ["/", "max combo", "new record", "track", "$$", ">>", "clear", "achievement", "559", "554", "monitor", "))", "lawes", ".com", "$", "class"];
const ignore_withnums = ["master", "expert", "re:master", "good", "great", "perfect", "miss", "critical", "critical perfect", "combo", "best", "av", "lv", "rating", "mybest", "my best", "touch", "dx"];

const std_contains = ["スタンタード", "スタンタード", "スタンダード", "ボタン", "スキップ", "クレジット", "スタンダード", "スタンダ", "ンダード"];
const dx_contains = ["でらっくす", "らっくす", "でらっくスコア", "でらっくす", "てらっくす", "らっく", "でらっくスコア", "らっ", "おら", "から", "でっくす", "でっくす]", "っくす", "でらっ", "つぎへ", "つぎ"];

const target_labels = [
  "Technology",
  "Graphics",
  "Machine",
  "Graphic design",
  "Art",
  "Illustration",
  "Circle",
  "Games",
  "Electric blue",
  "Signage",
  "Font"
];

// Initialize the client
const client = new vision.ImageAnnotatorClient({
  keyFilename: Secrets.OCR_KEYFILE,
});

async function processImage(imageUrl) {
  try {
    // Make an HTTP GET request to the image URL
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    // Check if the response status is OK (status code 200)
    if (response.status === 200) {
      // Get the image data as a Buffer
      const imageBuffer = Buffer.from(response.data, 'binary');

      // Now you can work with the image data in memory
      // For example, you can send it to a processing library or display it in a web application
      return imageBuffer;
    } else {
      console.error('[ERROR]: Failed to download image. HTTP status:', response.status);
    }
  } catch (error) {
    console.error('[ERROR]: Error processing image:', error.message);
  }
}

// Detect text in the image
async function detectText(image) {
  const [labelResult] = await client.labelDetection(image);
  const labels = labelResult.labelAnnotations;
  let label_counter = 0;
  let circle_found = false;

  // Print labels and descriptions
  let queryLog = `Image Labels: \n`;
  labels.forEach((label, index) => {
    if (target_labels.includes(label.description)){
      queryLog += `- ${label.description}: ${label.score.toFixed(1)} ✅\n`;
      label_counter++;
    } else {
      queryLog += `- ${label.description}: ${label.score.toFixed(1)} ❌\n`;
    }

    if (label.description == "Circle" && label.score > 0.6){
      circle_found = true;
    }
  });
  queryLog += `\n`;

  if (label_counter < 3 || !circle_found){
    return { queryLog: queryLog, textAnnotations: null, result: null};
  }

  const [textResults] = await client.textDetection(image);
  let textAnnotations = textResults.textAnnotations;

  // Sort textAnnotations by Y coordinate (top to bottom) and then by X coordinate (left to right)
  textAnnotations.sort((a, b) => {
    return a.boundingPoly.vertices[0].y - b.boundingPoly.vertices[0].y;
  });

  return { queryLog: queryLog, textAnnotations: textAnnotations, result: null};

}

async function getResults(image){
  let textResults = await detectText(image);
  let annotations = textResults.textAnnotations;
  let queryLog = textResults.queryLog;

  if (annotations == null){
    return { queryLog: `${queryLog}Invalid Image.`, result: null};
  }

  let height = 500;
  let lvIndex = 0;
  let ratingIndex = 0;
  let accFound = [];
  let accIndicies = [];
  let possible_songs = [];
  let lvlFoundIndex = 0;
  let lvlFoundMin = 0;
  let lvlFoundMax = 0;
  let accScore = 0;
  let diffVersion = null;
  let plusFound = false;
  let reFound = false;
  let colonFound = false;
  let isPb = false;
  let isStandard = false;
  let isDx = false;

  let newFound = true; // false;
  let recordFound = true; // false;
  let containsEnd = false;
  let containsDream = false;

  annotations.forEach(annotation => {
    if (annotation.boundingPoly.vertices[0].y > height){
      height = annotation.boundingPoly.vertices[0].y;
    }
  })

  let split = annotations[0].description.split('\n');
  split.forEach((item, index) => {
    annotations.push({
      description: item,
      boundingPoly: {vertices: [{y: index / split.length * height}]}
    });

    // console.log(`item - ${item} - ${index / split.length} - ${index / split.length * height}`);
  });

  let ignore_exact_found_count = 0;
  let wacca_count = 0;
  queryLog += `Text Labels:\n`
  annotations.forEach((annotation, index) => {
    if (index > 0) {
      let description = annotation.description.toLowerCase();
      queryLog += `${description}`;

      if (index < annotations.length - 1){
        queryLog += `, `;
      }

      description = description.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      description.replace('"', '');
      // console.log(description);
      if (lvIndex == 0 && (description.indexOf("lv") >= 0 || description == "av")){
        lvIndex = index;
      }
      if (annotation.boundingPoly.vertices[0].y < height * 0.65 && (description.endsWith('%') || description.endsWith('x'))){
        let acc = parseFloat(description.replace('%', '').replace('x', '').replace(' ', ''));
        if (description.indexOf('00') == 0 && acc > 0 && acc < 1){
          let new_desc = `1${description}`;
          acc = parseFloat(new_desc.replace('%', '').replace('x', ''));
        }
        if (description.length >= 7 && description.length <= 10 && acc != null  && description.indexOf('.') >= 2 && acc != NaN && acc > 70 && acc <= 101.001 && !accFound.includes(acc)) {
          accFound.push(acc);
        } else {
          accIndicies.push(index);
        }
      }

      if (description.indexOf("new") == 0){
        newFound = true;
      }
      if (description.indexOf("record") >= 0 || description.indexOf("recono") >= 0){
        recordFound = true;
      }
      if (description.indexOf("end") >= 0){
        containsEnd = true;
      }
      if (description.indexOf("dream") >= 0){
        containsDream = true;
      }
      if (description.indexOf("rating") == 0){
        ratingIndex = index;
      }
      if (description == "+"){
        // plusFound = true;
      }
      if (description.indexOf("re") == 0 && description.length <= 3){
        reFound = true;
      }
      if (description.indexOf(":") >= 0 && description.indexOf(":") <= 3){
        colonFound = true
      }

      Object.values(Difficulties).forEach(difficulty => {
        difficulty.search_titles.forEach(search_title => {
          if (description.indexOf(search_title) == 0){
            diffVersion = difficulty;
          }
        });
      });

      if (diffVersion == Difficulties.MASTER){
        if (colonFound && reFound){
          if (containsEnd && containsDream){
            diffVersion = Difficulties.MASTER;
          } else {
            diffVersion = Difficulties.REMASTER;
          }
        }
      }

      // console.log(description);
      let invalidShort = !containsNonEnglishCharacters(description) && description.length <= 3 && description != "[x]";
      // console.log(`desc: ${description} - ${annotation.boundingPoly.vertices[0].y} - ${height * 0.3} - ${height * 0.7}`);
      // console.console.log(`${desc}`);

      if (wacca_identifiers.includes(description)){
        wacca_count++;
      }

      if (ignore_exact.includes(description)){
        ignore_exact_found_count++;
      } else if (invalidShort || !isNaN(description) || possible_songs.includes(description) || description.indexOf('%') >= 0 || description.startsWith("-")) {
        // console.log(`failed: ${description}`);
        // Ignore
      } else if (annotation.boundingPoly.vertices[0].y > height * 0.1 && annotation.boundingPoly.vertices[0].y < height * 0.8 ){
        var validsearch = true;
        ignore_contains.forEach(x => {
          if (validsearch == true && description.indexOf(x) >= 0){
            validsearch = false;
            // console.log(`failed2: ${description}`);
          }
        });

        dx_contains.forEach(x => {
          if (description.indexOf(x) >= 0){
            isDx = true;
            validsearch = false;
          }
        });

        std_contains.forEach(x => {
          if (description.indexOf(x) >= 0){
            isStandard = true;
            validsearch = false;
          }
        });

        if (validsearch == true){
          ignore_withnums.forEach(x => {
            let search_withnums = description.replace(x, '').replace(',','');
            if (validsearch == true && description.indexOf(x) >= 0 && parseInt(search_withnums) >= 0){
              validsearch = false;
              // console.log(`failed3: ${description}`);
            }
          });
        }

        if (containsOnlyNumbers(description) && description != "39" && description != "411"){
          validsearch = false;
        }

        if (validsearch){
          // console.log(`success: ${description}`);
          possible_songs.push(description);
        }
      }
    }
  });

  annotations.forEach((annotation, index) => {
    const description = annotation.description.toLowerCase();
    if (getWithinRange(lvIndex, index, 10)){
      let lvTextIndex = description.indexOf('lv');
      if (lvTextIndex < 0){
        lvTextIndex = 0;
      } else {
        lvTextIndex = lvTextIndex + 2;
      }
      let num = description.substring(lvTextIndex);
      // if (containsOnlyNumbers(num)){
        if (!num.endsWith('+') && plusFound){
          num = `${num}+`;
        }
        let difficulty = getConstantFromText(num);
        if (difficulty >= 6 && difficulty <= 15 && Math.abs(index - lvIndex) < Math.abs(lvlFoundIndex - lvIndex)){
          lvlFoundMin = difficulty;
          lvlFoundIndex = index;
          // lvlFoundMax = getConstantFromText(num, true);
          if (!num.endsWith('+') && !plusFound){
            num = `${num}+`;
          }
          lvlFoundMax = getConstantFromText(num, true);
        }
      // }
    }

    // TODO: OPTIMIZE
    accIndicies.forEach((accIndex) => {
      if (getWithinRange(accIndex, index, 5) && description.length >= 7 && description.length <= 10 && description.indexOf('.') >= 2){
        let numCheck = description.replace('%', '').replace('x', '');
        const acc = parseFloat(numCheck);
        if (acc != null && acc != NaN && acc > 80 && acc <= 101.001 && !accFound.includes(acc)){
          accFound.push(acc);
        }
      }
    });
  });

  accFound.sort((a, b) => {
    return a - b;
  })

  if (newFound && recordFound){
    isPb = true;
    if (accFound.length >= 1){
      accScore = accFound[accFound.length - 1];
    }
  } else {
    if (accFound.length >= 2){
      accScore = accFound[accFound.length - 2];
    }
    else {
      accScore = accFound[accFound.length - 1];
    }
  }

  if (ignore_exact_found_count < 5 || wacca_count >= 8){
    queryLog += `\nInvalid Image detected.\n- maimai labels: ${ignore_exact_found_count}\n- wacca labels: ${wacca_count}.`;
    return { queryLog: queryLog, result: null};
  }

  let currated = keepLargestEntries(possible_songs);
  let result = {
    lvlFoundMin: lvlFoundMin,
    lvlFoundMax: lvlFoundMax,
    accScore: accScore,
    possible_songs: currated,
    diffVersion: diffVersion,
    isPb: isPb,
    isStandard: isStandard,
    isDx: isDx
  };

  queryLog += `\n\nValid Image detected.\n`;
  queryLog += `- lvlFoundMin: ${lvlFoundMin}\n`;
  queryLog += `- lvlFoundMax: ${lvlFoundMax}\n`;
  queryLog += `- isStandard: ${isStandard}\n`;
  queryLog += `- isDx: ${isDx}\n`;
  queryLog += `- accScore: ${accScore}%\n`;
  queryLog += `- possible songs: ${possible_songs.join(', ')}\n`;
  if (diffVersion == null){
    queryLog += `- diffVersion: null\n`;
  } else {
    queryLog += `- diffVersion: ${diffVersion.label}\n`;
  }
  queryLog += `- isPb: ${isPb}`;

  return {queryLog: queryLog, result: result};
}

function containsNonEnglishCharacters(text) {
  // Use a regular expression to match non-English characters
  const regex = /[^\x00-\x7F]/; // Matches any character outside the ASCII range
  return regex.test(text);
}

function containsOnlyNumbers(str) {
  let test_str = str.replace(" ", "").replace("-", "").replace("/", "").replace("%", "").replace(".", "");
  return /^\d+$/.test(test_str);
}

function getWithinRange(index, value, tolerance = 3){
	return Math.abs(value - index) <= tolerance;
}

function hasFourDigitsAndPercent(input) {
  const pattern = /^\d+\.\d{4}%$/;
  return pattern.test(input);
}

function getConstantFromText(input, max = false) {
  if (typeof input !== "string"){
    return -1;
  }
  if (input.endsWith('+')) {
    const numWithoutPlus = parseInt(input);
		if (!numWithoutPlus || numWithoutPlus === NaN || numWithoutPlus < 0){
			return -1;
		} else if (max){
			return numWithoutPlus + 0.9;
		}
    return numWithoutPlus + 0.7;
  } else if (input.includes(".")) {
		const numWithoutPlus = parseFloat(input);
		if (!numWithoutPlus || numWithoutPlus === NaN || numWithoutPlus < 0){
			return -1;
		}
		return Math.floor(numWithoutPlus * 10)/10;
	} else {
		const numWithoutPlus = parseInt(input);
		if (!numWithoutPlus || numWithoutPlus === NaN || numWithoutPlus < 0){
			return -1;
		} else if (max) {
			return numWithoutPlus + 0.6;
		}
    return numWithoutPlus;
  }
}

function keepLargestEntries(arr) {
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    let isLargest = true;

    for (let j = 0; j < arr.length; j++) {
      if (i !== j && arr[j].includes(arr[i])) {
        isLargest = false;
        break;
      }
    }

    if (isLargest) {
      result.push(arr[i]);
    }
  }

  return result;
}


async function getResultsFromImage(url){
  //try {
    var image = await processImage(url);
    var result = await getResults(image);
    return result;
  // } catch (exception) {
  //   return { queryLog: `Exception: ${exception.message}`, result: null};
  // }
}


module.exports = getResultsFromImage;
