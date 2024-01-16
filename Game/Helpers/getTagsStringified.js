function getTagsStringified(tags, flags, hasNone = false){
	let result = '';

	for (const key in tags) {
	  const tag = tags[key];

	  if ((flags & tag.id && tag.id != 0) || (tag.id == 0 && hasNone)) {
	    if (result) {
	      result += ', ';
	    }
	    result += tag.label;
	  }
	}

	return result;
}

module.exports = getTagsStringified;
