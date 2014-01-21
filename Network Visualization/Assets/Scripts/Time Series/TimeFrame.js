#pragma strict

//Every datafile gets one Timeframe which specifies the columns for start and end with timeseries.
class TimeFrame {

	private var file : DataFile;
	private var startColumns = new List.<Attribute>();
	private var endColumns = new List.<Attribute>();

	private var validStart = true; //is every column valid?
	private var validEnd = true;
	private var invalidMessages = ["",""];

	public function TimeFrame(file : DataFile) {
		this.file = file;
	}

	//Checks that both start and end are valid.
	function isValid() {
		return (isValid(true) && isValid(false) );
	}

	//Checks that start or end is valid.
	function isValid(isStart : boolean) {
		if (isStart) {
			return validStart;
		} else {
			return validEnd;
		}
	}

	function isUsed() {
		return (startColumns.Count > 0 || endColumns.Count > 0);
	}

	function getColumnIndex(attribute : Attribute, isStart : boolean) {
		if (isStart) {
			var relevantColumns = startColumns;
		} else {
			relevantColumns = endColumns;
		}
		for (var i = 0 ; i < relevantColumns.Count ; i++) {
			if (relevantColumns[i] == attribute) {
				return i;
			}
		}
		return -1;
	}

	private function setValid(isStart : boolean, val : boolean) {
		if (isStart) {
			validStart = val;
		} else {
			validEnd = val;
		}
	}

	function getInvalidMessage(isStart : boolean) {
		if (isStart) {
			return invalidMessages[0];
		} else {
			return invalidMessages[1];
		}
	}

	function getColumns(start : boolean) {
		if (start) {
			return startColumns;
		} else {
			return endColumns;
		}
	}

	function addColumn(attribute : Attribute, isStart : boolean) {
		//Check if it's in the columns already.
		if (isStart) {
			var checkColumns = startColumns;
		} else {
			checkColumns = endColumns;
		}

		//Check if the attribute already in this list.
		for (var column in checkColumns) {
			if (attribute == column) {
				Debug.Log("Already Added");
				return;
			} 
		}

		//add it to the list and update the aspect.
		checkColumns.Add(attribute);
		attribute.setAspect(Attribute.TIME_SERIES, true);
		updateValid();
	}

	function removeColumn(attribute : Attribute, isStart : boolean) {
		var columnIndex = getColumnIndex(attribute, isStart);
		removeColumn(columnIndex, isStart);
	}

	function removeColumn(index : int, isStart : boolean) {
		if (isStart) {
			var relevantColumns = startColumns;
			var otherColumns = endColumns;
		} else {
			relevantColumns = endColumns;
			otherColumns = startColumns;
		}

		//Remove the tuple from the list of columns.
		var doomedAttribute = relevantColumns[index];
		relevantColumns.RemoveAt(index);

		//Update the aspect
		for (var column in otherColumns) {
			if (doomedAttribute == column) {
				return; //It's present in the other columnSet, don't update aspect.
			}
		}
		doomedAttribute.setAspect(Attribute.TIME_SERIES, false);	
		updateValid();
	}

	function updateValid() {

		var wasValid = isValid();

		validStart = true;
		validEnd = true;
		invalidMessages = ["",""];

		var startAndEnd = [startColumns, endColumns];
		
		//Used for tracking which columnSet you're on
		var onStart = true;
		var messageIndex = 0;

		for (var columnSet in startAndEnd) {

			var invalidated = false;

			//Check each column to make sure it's actually valid.
			for (var column in columnSet) {
				if (!column.hasValidTimeFrameFormat()) {
					invalidMessages[messageIndex] = column.getTimeFrameFormatWarning();
					setValid(onStart, false);
					invalidated = true;
					break;
				}
			}

			//If any individual column is invalid, stop.
			if (invalidated) {
				continue;
			}

			//Check each column to make sure you're not duplicating times.
			var seenLetters = new HashSet.<String>();
			for (var column in columnSet) {
				var format = column.getTimeFrameFormat();
				var letters = TimeParser.getUsedLetters(format);
				for (var letter in letters) {
					if (seenLetters.Contains(letter)) {
						invalidMessages[messageIndex] = "Duplicate entries for " + TimeParser.getNameOfLetter(letter);
						setValid(onStart, false);
					} else {
						seenLetters.Add(letter);
					}
				}
			}

			//Use the second columnSet.
			onStart = false;
			messageIndex = 1;
		}

		var valid = isValid();

		// If there has been a change and it is valid or 
		// If it used to be valid but has been invalidated.
		if (valid || wasValid && !valid) {
			file.UpdateDates();
		}

	}

	//Checks if a given attribute is present in the TimeFrame.
	function getPresence(attr : Attribute, isStart : boolean) {
		if (isStart) {
			var relevantColumns = startColumns;
		} else {
			relevantColumns = endColumns;
		}
		for (var attribute in relevantColumns) {
			if (attribute == attr) {
				return true;
			}
		}
		return false;
	}

}