function getChartsByPage(args, size){
	var start = size * args.page;
	var end = size * (args.page+1);
	var selected = args.search.results.slice(start, end);

	args.search.selected = selected;
	return args.search;
}

module.exports = getChartsByPage;
