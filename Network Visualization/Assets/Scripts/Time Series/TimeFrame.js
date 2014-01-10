#pragma strict

//Every datafile gets one Timeframe which specifies the columns for start and end with timeseries.
class TimeFrame {

	private var file : DataFile;
	private var startColumns = new List.<AFTuple>();
	private var endColumns = new List.<AFTuple>();

	private var requireStart = false;
	private var requireEnd = false;

	private var validStart = true; //is every column valid?
	private var validEnd = true;
	private var invalidMessages = ["",""];

	static var timeFormats = ["Year", "Month", "Day", "Hour", "Minute", "Second"];

	public function TimeFrame(file : DataFile) {
		this.file = file;
	}

	function isValid(isStart : boolean) {
		if (isStart) {
			return validStart;
		} else {
			return validEnd;
		}
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

	function getRequired(isStart) {
		if (isStart) {
			return requireStart;
		} else {
			return requireEnd;
		}
	}

	function setRequired(isStart : boolean, required : boolean) {
		if (isStart) {
			requireStart = required;
		} else {
			requireEnd = required;
		}
	}

	function getColumns(start : boolean) {
		if (start) {
			return startColumns;
		} else {
			return endColumns;
		}
	}

	function addColumn(attribute : Attribute, start : boolean) {
		//Check if it's in the columns already.
		if (start) {
			var checkColumns = startColumns;
		} else {
			checkColumns = endColumns;
		}

		//Check if the attribute already in this list.
		for (var column in checkColumns) {
			if (attribute == column.attribute) {
				Debug.Log("Already Added");
				return;
			} 
		}

		//add it to the list and update the aspect.
		checkColumns.Add(new AFTuple(this, attribute, ""));
		attribute.setAspect(Attribute.TIME_SERIES, true);
		updateValid();
	}

	function removeColumn(isStart : boolean, index : int) {
		if (isStart) {
			var relevantColumns = startColumns;
			var otherColumns = endColumns;
		} else {
			relevantColumns = endColumns;
			otherColumns = startColumns;
		}

		//Remove the tuple from the list of columns.
		var doomedAttribute = relevantColumns[index].attribute;
		relevantColumns.RemoveAt(index);

		//Update the aspect
		for (var column in otherColumns) {
			if (doomedAttribute == column.attribute) {
				return;
			}
		}
		doomedAttribute.setAspect(Attribute.TIME_SERIES, false);	
		updateValid();
	}

	function updateValid() {

		validStart = true;
		validEnd = true;
		invalidMessages = ["",""];

		var startAndEnd = [startColumns, endColumns];
		
		//Used for tracking which columnSet you're on
		var onStart = true;
		var messageIndex = 0;

		for (var columnSet in startAndEnd) {
			var seenFormats = new HashSet.<String>();
			for (var column in columnSet) {
				var format = column.getFormat();
				if (!column.isValid()) { 
					setValid(onStart, false);	
					invalidMessages[messageIndex] = "Invalid Column(s)";
					break;
				} else if (seenFormats.Contains(format)) {
					setValid(onStart, false);
					invalidMessages[messageIndex] = "Duplicate Formats";
					break;	
				}
				seenFormats.Add(format);
			}

			//Use the second columnSet.
			onStart = false;
			messageIndex = 1;
		}

		seenFormats = new HashSet.<String>();
		for (var column in endColumns) {
			format = column.getFormat();
			if (!column.isValid() || seenFormats.Contains(format)) {
				validEnd = false;
				return;
			}
			seenFormats.Add(format);
		}
	}

}

// Holds attributes and formats
class AFTuple {
	var attribute : Attribute;
	private var format : String;
	private var valid : boolean;
	private var timeFrame : TimeFrame;

	public function AFTuple (timeFrame : TimeFrame, attribute : Attribute, format : String) {
		this.attribute = attribute;
		this.timeFrame = timeFrame;
		setFormat(format);
	}

	function getFormat() {
		return format;
	}

	function setFormat(format : String) {
		this.format = format;
		if (format in TimeFrame.timeFormats) {
			valid = true;
		} else {
			valid = false;
		}
		timeFrame.updateValid();
	}

	function isValid() {
		return valid;
	}
}