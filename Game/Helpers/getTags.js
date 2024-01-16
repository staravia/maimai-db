const { ParameterBuilder } = require("./../constants.js");

function getTags(str, obj, paramtype){
	let parameters = [];

	Object.values(obj).map(item => {
		item.search_titles.forEach(title => {
			if (title == str){ // if (title.indexOf(str) == 0){
				if (parameters.length == 0){
					parameters.push(new ParameterBuilder(item, paramtype));
				}
			}
		})
	});

	return parameters;
}

module.exports = getTags;
