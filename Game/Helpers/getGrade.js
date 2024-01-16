const { Grades } = require("./../constants.js");

function getGrade(accuracy){
	let result = Grades.F;
	Object.values(Grades).forEach(grade => {
		if (accuracy >= grade.requirement){
			result = grade;
		}
	});

	return result;
}

module.exports = getGrade;
