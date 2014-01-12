#pragma strict

//extended by Connection and Node
class TimeObject extends Data {

	static var DEFAULT_START_DATE = new Date(1, 1, 1);
	static var DEFAULT_END_DATE = new Date(9999, 1, 1);
	var startDate : Date = DEFAULT_START_DATE;
	var endDate : Date = DEFAULT_END_DATE;

	function UpdateDate() {
		var timeFrame = source.timeFrame;
		
		if (timeFrame == null || !timeFrame.isValid()) {
			resetDate(true);	resetDate(false);
		} else {
			UpdateDate(timeFrame, true);
			UpdateDate(timeFrame, false);
		}
	}

	private function UpdateDate(timeFrame : TimeFrame, isStart : boolean) {
		var columns = timeFrame.getColumns(isStart);
		var dateValues = new int[6];
		dateValues[0] = dateValues[1] = dateValues[2] = 1;

		for (var column in columns) {
			var attr_index = column.attribute.column_index;
			dateValues[column.getFormatIndex()] = GetNumeric(attr_index);
		}

		try {
			var date = new Date(dateValues[0], dateValues[1], //create the date
					dateValues[2], dateValues[3], dateValues[4], dateValues[5]);
			setDate(isStart, date);
		} catch (err) {
			resetDate(isStart);
		}
	}

	function getDate(isStart : boolean) {
		if (isStart) {
			return startDate;
		} else {
			return endDate;
		}
	}

	function resetDate(isStart : boolean) {
		var timeSeriesController = GameObject.FindGameObjectWithTag("GameController").GetComponent(TimeSeriesController);
		if (isStart) {
			if (startDate != DEFAULT_START_DATE) {
				timeSeriesController.removeDate(startDate);
			}
			startDate = DEFAULT_START_DATE;
		} else {
			if (endDate != DEFAULT_END_DATE) {
				timeSeriesController.removeDate(endDate);
			}
			endDate = DEFAULT_END_DATE;
		}
	}

	function setDate(isStart : boolean, date : Date) {
		var timeSeriesController = GameObject.FindGameObjectWithTag("GameController").GetComponent(TimeSeriesController);
		resetDate(isStart); //Remove for TimeSeriesController bookkeeping
		if (isStart) {
			startDate = date;
		} else {
			endDate = date;
		}
		if (date != DEFAULT_START_DATE && date != DEFAULT_END_DATE) {
			timeSeriesController.addDate(startDate);
		}
	}

	function Set(attribute : Attribute, value : String) {
		//Actually change the value
		super.Set(attribute, value);
		
		//Update visible values in case that changed.
		if (initialized) {
			UpdateDate();
		}
	}

}