#pragma strict

//Every datafile gets one Timeframe which specifies the columns for start and end with timeseries.
class TimeFrame {

	@System.NonSerialized
	private var file : DataFile;
	@System.NonSerialized
	private var startColumns = new List.<Attribute>();
	@System.NonSerialized
	private var endColumns = new List.<Attribute>();

	private var validStart = true; //is every column valid?
	private var validEnd = true;
	private var invalidMessages = ["",""];

	public function TimeFrame(){};	//Default Constructor for serialization; should not be used.

	public function TimeFrame(file : DataFile) {
		this.file = file;
	}

	//Checks that both start and end are valid.
	function isValid() {
		return (validStart && validEnd);
	}

	//Checks that start or end is valid.
	function isValid(isStart : boolean) {
		return (isStart) ? validStart : validEnd;
	}

	function isUsed() {
		return (startColumns.Count > 0 || endColumns.Count > 0);
	}

	function getColumnIndex(attribute : Attribute, isStart : boolean) : int{
		var relevantColumns = (isStart) ? startColumns : endColumns;
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
		return (isStart) ? invalidMessages[0] : invalidMessages[1];
	}

	function getColumns(start : boolean) {
		return (start) ? startColumns : endColumns;
	}

	function addColumn(attribute : Attribute, isStart : boolean) {
		var columns = (isStart) ? startColumns : endColumns;
		if (columns.Contains(attribute)) {
			Debug.Log("Already Added");
			return;
		}

		columns.Add(attribute);
		updateValid();
	}

	function removeColumn(attribute : Attribute, isStart : boolean) {
		var columnIndex = getColumnIndex(attribute, isStart);
		removeColumn(columnIndex, isStart);
	}

	function removeColumn(index : int, isStart : boolean) {
		var relevantColumns = (isStart) ? startColumns : endColumns;
		relevantColumns.RemoveAt(index);
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
	function usesAttribute(attr : Attribute) {
		return (usesAttribute(attr, false) || usesAttribute(attr, true));
	}
	function usesAttribute(attr : Attribute, isStart : boolean) {
		return (getColumnIndex(attr, isStart) > -1);
	}

}