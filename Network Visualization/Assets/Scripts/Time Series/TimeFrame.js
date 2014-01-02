#pragma strict

//Every datafile gets one Timeframe which specifies the columns for start and end with timeseries.
class TimeFrame {

	private var file : DataFile;
	private var startColumns = new List.<AFTuple>();
	private var endColumns = new List.<AFTuple>();

	public function TimeFrame(file : DataFile) {
		this.file = file;
	}

	function getColumns(start : boolean) {
		if (start) {
			return startColumns;
		} else {
			return endColumns;
		}
	}

	function addColumn(attribute : Attribute, start : boolean) {

		//Check if it's in the start columns.
		for (var column in startColumns) {
			if (attribute == column.attribute) {
				Debug.Log("Already Added");
				return;
			} 
		}

		//Check if it's in the end columns.
		for (var column in endColumns) {
			if (attribute == column.attribute) {
				Debug.Log("Already Added");
				return;
			} 
		}

		attribute.setAspect(Attribute.TIMESERIES);
		if (start) {
			startColumns.Add(new AFTuple(attribute, ""));
		} else {
			endColumns.Add(new AFTuple(attribute, ""));
		}

	}

	function removeColumn(isStart : boolean, index : int) {
		if (isStart) {
			startColumns[index].attribute.setAspect(Attribute.NORMAL); //Clear the aspect.
			startColumns.RemoveAt(index);
		} else {
			endColumns[index].attribute.setAspect(Attribute.NORMAL); //Clear the aspect.
			endColumns.RemoveAt(index);
		}
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