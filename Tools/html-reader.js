const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the URL of the dynamic website
    await page.goto('https://arcade-songs.zetaraku.dev/maimai/song/?id=NightTheater');

    // Wait for JavaScript to finish executing (adjust the timeout as needed)
    await page.waitForTimeout(5000);

    // Get the final HTML content after JavaScript execution
    const htmlContent = await page.content();

    console.log(htmlContent);
    fs.writeFile('./Tools/output.txt', htmlContent, err => {
      if (err) {
        console.error('Error writing to file:', err);
        return;
      }
      console.log('File has been written successfully.');
    });

    await browser.close();
  })();
