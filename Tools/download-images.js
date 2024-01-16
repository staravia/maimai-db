const axios = require('axios');
const fs = require('fs');
const path = require('path');

let imageUrls = [];
const missing_charts_file = "Tools/maimai db - missing charts.tsv";
const mai_data_file = "Tools/mai-data.json";
const saveDirectory = path.join(__dirname, 'new-images'); // Change 'images' to your desired directory name
const { Difficulties, Categories, DxVersion, GameVersion, ParameterType, ParameterBuilder } = require("./../Game/constants.js");

// Create the directory if it doesn't exist
if (!fs.existsSync(saveDirectory)) {
  fs.mkdirSync(saveDirectory);
}

function getKey(title, dx){
  return `${title}-${dx}`;
}

// Download and save each image
async function downloadImages(charts) {
  for (let i = 0; i < charts.length; i++) {
    const imageUrl = charts[i];
    const imageFilename = path.basename(imageUrl);
    const imagePath = path.join(saveDirectory, imageFilename);

    try {
      const response = await axios.get(imageUrl, { responseType: 'stream' });
      response.data.pipe(fs.createWriteStream(imagePath));

      console.log(`Image ${i + 1} downloaded and saved as ${imagePath}`);
    } catch (error) {
      console.error(`Error downloading image ${i + 1}:`, error.message);
    }
  }
}

async function getCharts(){
  // read missing charts file
  let missingCharts = [];
  let missing_charts_content = await fs.readFileSync(missing_charts_file, "utf8");
  let missing_charts = missing_charts_content.split('\n')
    .map(profile => {
        const [title, dxVersion, url] = profile.split('\t');
        const chart = { title, dxVersion, url, isValid: false };
        const key = getKey(title, dxVersion);
        missingCharts[key] = chart;
        return chart
    });

  // read mai-data file
  let mai_data_content = await fs.readFileSync(mai_data_file);
  const mai_data = await JSON.parse(mai_data_content);

  // probe mai-data file
  return new Promise((resolve, reject) => {
    let rows = [];

    for (song of mai_data.songs){
      let once = false;
      for (chart of song.sheets){
        let dx = 0;
        switch (chart.type) {
          case "dx":
            dx = DxVersion.DX.id;
            break;
          default:
            dx = DxVersion.ST.id;
            break;
        }

        if (once == false){
          let key = getKey(song.title, dx)
          if (missingCharts[key] != undefined && chart.levelValue > 0){
            let url = `https://dp4p6x0xfi5o9.cloudfront.net/maimai/img/cover/${song.imageName}`;
            missingCharts[key].isValid = true;
            console.log(`add: ${url}`);
            rows.push(url);
            once = true;
          }
        }
      }
    }

    resolve(rows);
  });
}

async function handleImages(){
  let charts = await getCharts();
  downloadImages(charts)
}

handleImages();
