#pragma strict

static var presetNames = ["Year(4)", "Year(2)", "Month", "Day", "Hour", "Minute", "Second", 
							"MM/dd/yyyy", "MM/dd/yy",
							"Custom"];
static var presetValues = ["yyyy", "yy", "MM", "dd", "hh", "mm", "ss",
							"MM/dd/yyyy", "MM/dd/yy",
							"!"];


//Used for validatiion
static var names = ["Year", "Month", "Day", "Hour", "Minute", "Second"];
static var letters = ["y", "M", "d", "h", "m", "s"];
static var seperators = ["/", "-"];

static function getFormatIndex(format : String) {
	//Return -1 if the string is blank.
	if (format == "") {
		return -1;
	}

	for (var i = 0 ; i < presetValues.length-1 ; i++) {
		if (format == presetValues[i]) {
			return i;
		}
	}

	//Returns "Custom" if nothing else matches
	return presetValues.length-1;
}

static function getFormatWarning(format : String) {
	if (format == "") {
		return "Format cannot be blank";
	} else if (format.length == 1) {
		if (format in letters || format in seperators) {
			return getNameOfLetter(format) + " cannot be 1 character";
		} else {
			return "Invalid character: '" + format + "'";
		}
	}

	var prevChar = "";
	var sequenceCount = 0; //used for ensuring there are only 2 or 4 consecutive letters.
	var seenTimes = new HashSet.<String>(); //used for ensuring there are no repeated dates.

	for (var index = 0 ; index < format.length ; index++) {
		var character = format[index];
		var c = character+"";

		//Test if the character is invalid.
		if (c not in letters && c not in seperators) {
			return "Invalid character: '" + c + "'";
		}

		if (!(c in seperators)) {
			
			//Test if you've seen a complete sequence with this time.
			if (c in seenTimes) {
				return "Cannot repeat " + getNameOfLetter(c);
			}

			//Test if you're seeing exactly 2 or 4 letters in a row.
			if (c == prevChar ) {
				sequenceCount++;
				if (c == "y") {
					if (sequenceCount != 2 && sequenceCount != 4) {						
						//If it's 3, check if there is another character after it.
						if (sequenceCount == 3 && index < format.length-1 && format[index+1]=="y") {
							//There is a trailing y.
						} else {
							return "Year should be 2 or 4 characters";
						}
					}
				} else { //c is a letter other than y
					if (sequenceCount != 2) {
						return getNameOfLetter(c) + " should be exactly 2 characters";
					}
				}
			} else { //c is different from prevChar
				if (sequenceCount == 1 && prevChar in letters) {
					return getNameOfLetter(prevChar) + " cannot be 1 character";
				}
				sequenceCount = 1;
				seenTimes.Add(prevChar);
			}
		} else {
			seenTimes.Add(prevChar);
		}



		prevChar = c;
	}
	
	if (sequenceCount == 1 && prevChar in letters) {
		return getNameOfLetter(prevChar) + " cannot be 1 character";
	}



	//No errors.
	return "";
}

static function getNameOfLetter(c : String) {
	for (var i = 0 ; i < letters.length ; i++) {
		if (c == letters[i]) {
			return names[i];
		}
	}
	return "?";
}

static function getIndexOfLetter(c : String) {
	for (var i = 0 ; i < letters.length ; i++) {
		if (c == letters[i]) {
			return i;
		}
	}
	return -1;
}

static function getUsedLetters(format : String) {
	var usedLetters = new HashSet.<String>();
	for (var letter in format) {
		var letter_string = ""+letter;
		if (letter_string in letters) {
			usedLetters.Add(letter_string);
		}
	}
	return usedLetters;
}

//Parses a set of values in a TimeObject based on the formats specified in the TimeFrame.
//This throws exceptions, and should always be called from within a try/catch block.
static function parse(formats : List.<String>, inputs : List.<String>) {
	var dateValues = new int[6];
	dateValues[0] = dateValues[1] = dateValues[2] = 1; //yMd cannot be 0.
	for (var i = 0 ; i < formats.Count ; i++) {
		var format = formats[i];
		var input = inputs[i];

		while(format.length > 0) {

			//Save the first character in the format string.
			var firstChar = format[0] + "";
			var timeIndex = getIndexOfLetter(firstChar);

			//Remove characters until you find a valid letter.
			if (firstChar in seperators) {
				format = format[1:];
				input = input[1:];
				continue;
			} 

			//Calculate the next section of the format.
			var firstDifferentIndex = 1;
			while(firstDifferentIndex < format.length && format[firstDifferentIndex] == firstChar) {
				firstDifferentIndex++;
			}

			//You reached the end of the string while consuming the format.
			if (firstDifferentIndex == format.length) {
				dateValues[timeIndex] = float.Parse(input);
				break;
			} else { //You're ending the sequence without completely consuming the format.
				var nextChar = format[firstDifferentIndex]+"";
				if (nextChar in seperators) {
					//Format ends in a seperator. This means there can 
					//be flexibility in input length (i.e. 1 char is valid)
					format = format[firstDifferentIndex:];

					var seperatorIndex = input.IndexOf(nextChar);
					dateValues[timeIndex] = float.Parse(input[0:seperatorIndex]);

					input = input[seperatorIndex:];
				} else { 
					//There are no seperators. No room for flexibility on reading input.
					format = format[firstDifferentIndex:];
					dateValues[timeIndex] = float.Parse(input[0:firstDifferentIndex]);
					input = input[firstDifferentIndex:];
				}
			}


		}

	}

	var date = new Date(dateValues[0], dateValues[1], //create the date
			dateValues[2], dateValues[3], dateValues[4], dateValues[5]);
	return date;
}

static function log(s : String) {
		Debug.Log(s);
} 
