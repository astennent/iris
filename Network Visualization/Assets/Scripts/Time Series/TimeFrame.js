#pragma strict

//Every datafile gets one Timeframe which specifies the columns for start and end with timeseries.
class TimeFrame {

	private var file : DataFile;
	private var startColumns = new List.<AFTuple>();
	private var endColumns = new List.<AFTuple>();

	private var requireStart = false;
	private var requireEnd = false;


	public function TimeFrame(file : DataFile) {
		this.file = file;
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
		checkColumns.Add(new AFTuple(attribute, ""));
		attribute.setAspect(Attribute.TIME_SERIES, true);

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
	}

}

// Holds attributes and formats
class AFTuple {
	var attribute : Attribute;
	var format : String;

	public function AFTuple (attribute : Attribute, format : String) {
		this.attribute = attribute;
		this.format = format;
	}
}