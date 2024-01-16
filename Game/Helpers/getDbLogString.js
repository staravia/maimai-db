function getDbLogString(query, params, log_string){
	let query_string = query;
	params.forEach(param => {
		query_string = query_string.replace('?', JSON.stringify(param));
	});

	query_string.replace(`\n`, ` `);

	console.log(`[${log_string}]: ${query_string}`);
	return `${query_string}\n\n`;
}

module.exports = getDbLogString;
