const { BookingType, DxVersion, Categories, Grades, GameVersion, Difficulties, LockedStatus, Tags, Regions, Locale, Constants, Commands, ParameterBuilder, ParameterType, Months, Days } = require("./../constants.js");
const getTags = require("./getTags.js");

function getSearchArguments(str, ignore_non_search = false){
	// str = str.toLowerCase();
	let input = splitStringWithQuotes(str);
	let arguments = [];
	var invalidStr = "";

	for (let i = 1; i < input.length; i++){
		var results = getSearchArgument(input[i], ignore_non_search);
		results.forEach(result => {
			if (result != null) {
				if (result.type == ParameterType.INVALID){
					if (invalidStr == ""){
						invalidStr = `${result.value}`;
					} else {
						invalidStr = `${invalidStr} ${result.value}`;
					}
				} else {
					if (invalidStr != "") {
					 arguments.push(new ParameterBuilder(invalidStr, ParameterType.SEARCH));
					 invalidStr = "";
				 	}
					arguments.push(result);
				}
			}
		});
	}

	if (invalidStr != "") {
		arguments.push(new ParameterBuilder(invalidStr, ParameterType.SEARCH));
	}

	return arguments;
}

function getSearchArgument(str, ignore_non_search){
	let lower = str.toLowerCase();
	str = str.normalize('NFC').replace(`'`, '').replace('！', '!').replace('～', '~').replace('･', '・').replace('（', '(').replace('）', ')');

	let parameters = [];
	if (!ignore_non_search){
		parameters = getTags(lower, Grades, ParameterType.GRADE);
		if (parameters.length != 0){
			return parameters;
		}
		parameters = getTags(lower, Regions, ParameterType.REGION);
		if (parameters.length != 0){
			return parameters;
		}
		parameters = getTags(lower, Days, ParameterType.DAY);
		if (parameters.length != 0){
			return parameters;
		}
		parameters = getTags(lower, Months, ParameterType.MONTH);
		if (parameters.length != 0){
			return parameters;
		}
		parameters = getTags(lower, BookingType, ParameterType.BOOKINGTYPE);
		if (parameters.length != 0){
			return parameters;
		}
	}
	parameters = getTags(lower, DxVersion, ParameterType.DX);
	if (parameters.length != 0){
		return parameters;
	}
	parameters = getTags(lower, Categories, ParameterType.CATEGORY);
	if (parameters.length != 0){
		return parameters;
	}
	parameters = getTags(lower, GameVersion, ParameterType.VERSION);
	if (parameters.length != 0){
		return parameters;
	}
	parameters = getTags(lower, Difficulties, ParameterType.DIFFICULTY);
	if (parameters.length != 0){
		return parameters;
	}
	parameters = getTags(lower, Tags, ParameterType.TAGS);
	if (parameters.length != 0){
		return parameters;
	}
	parameters = getTags(lower, LockedStatus, ParameterType.LOCKEDSTATUS);
	if (parameters.length != 0){
		return parameters;
	}
	parameters = getTags(lower, Locale, ParameterType.LOCALE);
	if (parameters.length != 0){
		return parameters;
	}

	let endsX = false;
	if (startsWithAnyQuote(str) && endsWithAnyQuote(str)) {
		str = str.slice(1, -1);
		str = str.toLowerCase();
		parameters.push(new ParameterBuilder(str, ParameterType.SEARCH));
		return parameters;
	} else if (str.endsWith('x')){
		const count = parseInt(str);
		if (count < 0){
			parameters.push(new ParameterBuilder(str, ParameterType.INVALID));
		} else if (count >= 1){
			parameters.push(new ParameterBuilder(count, ParameterType.COUNT));
			endsX = true;
		}
	} else if (lower.endsWith('hr') || lower.endsWith('h')){
		const count = parseInt(str);
		if (count <= 0 || count > 24 || isNaN(count)) {
			// parameters.push(new ParameterBuilder(str, ParameterType.INVALID));
		} else {
			parameters.push(new ParameterBuilder(count, ParameterType.DURATION));
			return parameters;
		}
	} else if (lower.endsWith('d')){
		const count = parseInt(str);
		if (count <= 0 || count > 20 || isNaN(count)) {
			// parameters.push(new ParameterBuilder(str, ParameterType.INVALID));
		} else {
			parameters.push(new ParameterBuilder(count * 24, ParameterType.DURATION));
			return parameters;
		}
	} else if (lower.endsWith('am')){
		let count = parseInt(str);
		if (count < 0){
			parameters.push(new ParameterBuilder(str, ParameterType.INVALID));
		} else if (count >= 1 && count <= 12){
			if (count == 12){
				count = 0;
			}
			parameters.push(new ParameterBuilder(count, ParameterType.TIME));
			return parameters;
		}
	} else if (lower.endsWith('pm')){
		let count = parseInt(str);
		if (count < 0){
			parameters.push(new ParameterBuilder(str, ParameterType.INVALID));
		} else if (count >= 1 && count <= 12){
			if (count < 12){
				count += 12;
			}
			parameters.push(new ParameterBuilder(count, ParameterType.TIME));
			return parameters;
		}
	} else if (lower.endsWith('%')) {
		var percent = parseFloat(str);
		if (!percent || percent === NaN || percent < 0){
			parameters.push(new ParameterBuilder(str, ParameterType.INVALID));
			return parameters;
		}
		percent = Math.floor(percent * 1000) / 1000;
		parameters.push(new ParameterBuilder(percent, ParameterType.PERCENT));
	} else if (str.startsWith('<') && str.endsWith('>')){
		// if (str.indexOf('@') >= 0){
			str = str.replace('<', '').replace('>', '').replace('@', '');
			parameters.push(new ParameterBuilder(str, ParameterType.USERID));
		// }
		// Ignore for now
		return parameters;
	}

	if (!endsX){
		const min = getConstantFromText(str, false);
		const max = getConstantFromText(str, true);

		if (min < 0 || max < 0){
			parameters.push(new ParameterBuilder(str, ParameterType.INVALID));
			return parameters;
		}
		parameters.push(new ParameterBuilder(min, ParameterType.CONSTANT));
		parameters.push(new ParameterBuilder(max, ParameterType.CONSTANT));
	}

	return parameters;
}

function getConstantFromText(input, max = false) {
  if (input.endsWith('+')) {
    const numWithoutPlus = parseInt(input);
		if (!numWithoutPlus || numWithoutPlus === NaN || numWithoutPlus < 1 || numWithoutPlus > 31){
			return -1;
		} else if (max){
			return numWithoutPlus + 0.9;
		}
    return numWithoutPlus + 0.7;
  } else if (input.includes(".")) {
		const numWithoutPlus = parseFloat(input);
		if (!numWithoutPlus || numWithoutPlus === NaN || numWithoutPlus < 1 || numWithoutPlus > 31){
			return -1;
		}
		return Math.floor(numWithoutPlus * 10)/10;
	} else {
		const numWithoutPlus = parseInt(input);
		if (!numWithoutPlus || numWithoutPlus === NaN || numWithoutPlus < 1 || numWithoutPlus > 31){
			return -1;
		} else if (max) {
			return numWithoutPlus + 0.6;
		}
    return numWithoutPlus;
  }
}

function splitStringWithQuotes(str) {
	var results = str.split(' ');
	var quote = -1;

	for (var i = 0; i < results.length; i++){
		const result = results[i];
		if (quote >= 0){
			results[quote] = `${results[quote]} ${result}`;
			results.splice(i, 1);
			i--;

			if (endsWithAnyQuote(result)){
				quote = -1;
			}

		} else if (startsWithAnyQuote(result) && !endsWithAnyQuote(result)){
			quote = i;
		}
	}

	return results;
}

function startsWithAnyQuote(str) {
  const quotes = ['"', '“', '”'];
	if (str == undefined || str == ""){
		return false;
	}

  return quotes.some(quote => str.startsWith(quote));
}

function endsWithAnyQuote(str) {
  const quotes = ['"', '“', '”'];

	if (str == undefined || str == "" || str.length == 1){
		return false;
	}

  return quotes.some(quote => str.endsWith(quote));
}

module.exports = getSearchArguments;
