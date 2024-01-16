function getAppendedArgumentsEntry(value, str){
	if (!str){
		str += `${value}`;
	} else {
		str += `, ${value}`;
	}
	return str;
}

module.exports = getAppendedArgumentsEntry;
