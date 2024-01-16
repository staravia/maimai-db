const { Tags } = require("./../constants.js");

function getTagSuffix(input, tagsOnRight = false){
	let tags = ``;
	let found = false;
	Object.values(Tags).forEach(tag => {
		if (tag.id != Tags.NONE.id && (input & tag.id) == tag.id){
			tags = `${tags}${tag.suffix}`;
			found = true;
		}
	});

	if (found) {
		if (!tagsOnRight){
			tags = `${tags} - `;
		} else {
			tags = ` - ${tags}`;
		}
	}
	return tags;
}

module.exports = getTagSuffix;
