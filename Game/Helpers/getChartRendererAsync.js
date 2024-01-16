const Canvas = require('canvas');
const { Categories, DxVersion, Constants } = require("./../constants.js");
const getGrade = require("./getGrade.js");
const getTags = require("./getTags.js");

async function getChartRendererAsync(charts, page = 0, user = -1){
	const img_buffer = 6;
	const img_size = 256;
	const img_border_size = img_size+img_buffer;
	const img_buffer_half = img_buffer/2;
	const text_pos = 190;
	const text_label_pos = 230;
	const text_number_offset_x = 248;
	const text_number_offset_y = 40;
	const gradient_start = 150;
	let new_row_index = 5; // 2Math.max(2, Math.ceil(charts.length));

	switch (charts.length) {
		case 4:
			new_row_index = 2;
			break;
		case 5:
		case 6:
			new_row_index = 3;
			break;
		case 7:
		case 8:
			new_row_index = 4;
			break;
	}
	// Create image
	const size_x = Math.min(new_row_index, charts.length) * (img_border_size + img_buffer) - img_buffer;
	const size_y = (Math.ceil(charts.length/new_row_index)) * (img_border_size + img_buffer) - img_buffer;
	var canvas = Canvas.createCanvas(size_x, size_y); // Create a canvas with the desired size
	var ctx = canvas.getContext('2d');

	const categoryFiles = Object.values(Categories).map(category => category.image_file);
	const versionFiles = Object.values(DxVersion). map(version => version.image_file);
	const allImageFiles = charts.map(chart => chart.dir).concat(versionFiles).concat(categoryFiles);
	// allImageFiles.map(imageFile => console.log(imageFile));

	return await Promise.all(allImageFiles.map(async imageFile => Canvas.loadImage(imageFile)))
		.then(images => {
		for (let index = 0; index < charts.length; index++) {
			var row = Math.floor(index/new_row_index);
			var img = images[index];
			var chart = charts[index];
			ctx.drawImage(img, index%new_row_index * (img_size + img_buffer * 2) + img_buffer_half, row * (img_size + img_buffer * 2) + img_buffer_half, img_size, img_size);
		}

		// Semi transparent overlay
		const isScore = charts.length > 0 && charts[0].stats != null && charts[0].stats != undefined;
		ctx.globalCompositeOperation = 'source-atop';
		if (isScore){
			ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
		} else {
			ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
		}
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = 'source-over';
		const darkerImage = canvas.toDataURL();

		for (let index = 0; index < charts.length; index++) {
			const row = Math.floor(index/new_row_index);
			const x = index % new_row_index * (img_size + img_buffer * 2);
			const y = row * (img_size + img_buffer * 2);
			const center_pos = x + img_border_size / 2;
			const gradient = ctx.createLinearGradient(0, gradient_start + y, 0, img_border_size + y);
			const chart = charts[index];
			const index_text = `${index + Constants.DefaultPageSize * page + 1}.`;
			gradient.addColorStop(0, chart.difficulty_ref.color_a);
			gradient.addColorStop(1, chart.difficulty_ref.color_b);

			ctx.strokeStyle = '#000000';
			ctx.lineWidth = img_buffer * 2;
			ctx.strokeRect(x, y, img_border_size, img_border_size);

			var dx_version = Math.log2(chart.dx_version);
			var is_utage = chart.dx_version == DxVersion.UTAGE.id;
			if (isScore){
				ctx.strokeStyle = '#333333';
			} else {
				ctx.strokeStyle = gradient;
			}

			ctx.lineWidth = img_buffer;
			ctx.strokeRect(x, y, img_border_size, img_border_size);
			ctx.drawImage(images[charts.length + dx_version], x + img_buffer*2, y + img_buffer*2, 110, 20);

			if (!isScore){
				ctx.drawImage(images[charts.length + versionFiles.length + Math.log2(chart.category)], x + img_buffer*2, y + img_buffer*3 + 20, 125, 20);
			}

			let yOffset = 0;
			let lvlText = ``;
			if (isScore){
				lvlText = Math.floor(chart.stats.rating);
				ctx.font = 'bold 72px Arial';
				yOffset = -33;
			} else {
				if (is_utage){
					if (chart.lvl <= 1){
						lvlText = "?";
					} else {
						let isPlus = !((`${chart.lvl.toFixed(1)}`).endsWith('0'));
						lvlText = Math.floor(chart.lvl);
						if (isPlus){
							lvlText += "+";
						}
						lvlText += "?";
					}
				} else {
				lvlText = chart.lvl.toFixed(1);
				}
				ctx.font = 'bold 64px Arial';
			}

			ctx.fillStyle = gradient;
			ctx.textAlign = 'center';
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 18;
			ctx.strokeText(lvlText, center_pos, text_pos + y + yOffset, img_size);
			ctx.strokeStyle = '#000000';
			ctx.lineWidth = 8;
			ctx.strokeText(lvlText, center_pos, text_pos + y + yOffset, img_size);
			ctx.fillText(lvlText, center_pos, text_pos + y + yOffset, img_size);

			let footerText = ``;
			if (isScore){
				ctx.font = 'bold 32px Arial';
				// ctx.strokeStyle = '#ffffff';
				// ctx.lineWidth = 10;
				// ctx.strokeText(footerText, center_pos, text_label_pos + y, img_size);
				if (chart.user_id == user){
					ctx.fillStyle = `#79fcfc`;
				} else {
					ctx.fillStyle = `#ffffff`;
				}

				ctx.strokeStyle = '#000000';
				ctx.lineWidth = 4;
				ctx.strokeText(chart.user, center_pos, text_label_pos + y + yOffset, img_size);
				ctx.fillText(chart.user, center_pos, text_label_pos + y + yOffset, img_size);

				let grade = getGrade(chart.accuracy);
				ctx.fillStyle = grade.color;
				footerText = `${grade.label} ${chart.accuracy.toFixed(2)}%`;
			} else {
				footerText = `${chart.difficulty_ref.label}`;
			}

			ctx.font = 'bold 30px Arial';
			// ctx.strokeStyle = '#ffffff';
			// ctx.lineWidth = 10;
			// ctx.strokeText(footerText, center_pos, text_label_pos + y, img_size);
			ctx.strokeStyle = '#000000';
			ctx.lineWidth = 4;
			ctx.strokeText(footerText, center_pos, text_label_pos + y, img_size);
			ctx.fillText(footerText, center_pos, text_label_pos + y, img_size);

			ctx.textAlign = 'right';
			ctx.font = 'bold 32px Arial';
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 6;
			ctx.strokeText(index_text, x + text_number_offset_x, text_number_offset_y + y);
			ctx.fillStyle = '#000000';
			ctx.fillText(index_text, x + text_number_offset_x, text_number_offset_y + y);
		}

		return canvas;
	})
	.catch(e => {
		console.error('Error loading images:', e);
	});
}

module.exports = getChartRendererAsync;
