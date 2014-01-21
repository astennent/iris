#pragma strict

//extended by Connection and Node
class TimeObject extends Data {

	static var DEFAULT_DATE = new Date(1, 1, 1);
	var startDate : Date = DEFAULT_DATE;
	var endDate : Date = DEFAULT_DATE;
	private var validTime : boolean = true;

	function Update() {
		renderer.enabled = hasValidTime();
	}

	//Called when the current date changes in the TimeLine or when the TimeObject's date is changed.
	function validateDate() {
		var timeSeriesController = GameObject.FindGameObjectWithTag("GameController").GetComponent(TimeSeriesController);
		var current_date = timeSeriesController.getCurrentDate();
		validTime = ((startDate <= current_date || startDate == DEFAULT_DATE) && 
				 (endDate > current_date || endDate == DEFAULT_DATE)); 
	}

	function hasValidTime() : boolean {
		var timeSeriesController = GameObject.FindGameObjectWithTag("GameController").GetComponent(TimeSeriesController);
		return (validTime || !source.timeFrame.isUsed() || !timeSeriesController.getEnabled());
	}

	function UpdateDate() {
		var timeFrame = source.timeFrame;
		
		if (timeFrame == null || !timeFrame.isValid() || !timeFrame.isUsed()) {
			resetDate(true);	resetDate(false);
		} else {
			UpdateDate(timeFrame, true);
			UpdateDate(timeFrame, false);
		}
		validateDate();
	}

	private function UpdateDate(timeFrame : TimeFrame, isStart : boolean) {
		var columns = timeFrame.getColumns(isStart);
		var formats = new List.<String>(); //list of all the formats of the attributes
		var values = new List.<String>(); //list of all this TimeObject's values for those attributes

		for (var column in columns) {
			var attr_index = column.column_index;
			formats.Add(column.getTimeFrameFormat());
			values.Add(Get(attr_index));
		}

		try {
			var date = TimeParser.parse(formats, values);
			setDate(isStart, date);
		} catch (err) {
			//Debug.Log(err);
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

	private function resetDate(isStart : boolean) {
		var timeSeriesController = GameObject.FindGameObjectWithTag("GameController").GetComponent(TimeSeriesController);
		var date = getDate(isStart);
		if (date != DEFAULT_DATE) {
			timeSeriesController.removeDate(date);
		}
		if (isStart) {
			startDate = date;
		} else {
			endDate = date;
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
		if (date != DEFAULT_DATE) {
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