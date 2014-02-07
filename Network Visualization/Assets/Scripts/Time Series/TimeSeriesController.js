#pragma strict

private static var timeSeriesEnabled = false;
private static var dates = new SortedDictionary.<Date, int>();

private static var datesList : List.<DateRatio>;
private static var lastWidth : int = 1;

private static var first_date : Date;
private static var last_date : Date;

private static var current_date : Date;

private static var playing = false;
private static var playTimeSeconds : float = 60;


function Update() {
	if (playing) {
		var totalSeconds = getTotalSeconds();
		var elapsedTime = Time.deltaTime;
		var curRatio = dateToRatio(current_date);
		var nextRatio = curRatio + elapsedTime/playTimeSeconds;
		if (nextRatio >= 1) { 

			//If you go over the end of the timeline, stop.
			setCurrentDate(getLastDate());
			playing = false;
		
		} else {
			var nextDate = ratioToDate(nextRatio);
			setCurrentDate(nextDate);
		}
	}	
}

static function isPlaying() {
	return playing;
}
static function togglePlaying() {
	playing = !playing;
}

static function getEnabled() {
	return timeSeriesEnabled;
}
static function toggleEnabled() {
	setEnabled(!timeSeriesEnabled);
}
static function setEnabled(timeSeriesEnabled : boolean) {
	this.timeSeriesEnabled = timeSeriesEnabled;
	validateAllTimeObjects();
}

static function getCurrentDate() {
	return current_date;
}
static function setCurrentDate(date : Date) {
	var dates_equivalent = datesAreEquivalent(current_date, date);
	current_date = date;
	if (!dates_equivalent) {
		validateAllTimeObjects();
	}
}

//Checks whether there are any changes in the timeline between the two dates.
static function datesAreEquivalent(date1 : Date, date2 : Date) {
	//Determine which date is earlier.
	if (date1 == date2) {
		return true;
	} else if (date1 < date2) {
		var early_date = date1;
		var later_date = date2;
	} else {
		early_date = date2;
		later_date = date1;
	}

	for (var date in dates.Keys) {
		if (date > early_date) {
			return (date > later_date);
		}
	}
	return true;
}


static function addDate(date : Date) {
	if (dates.ContainsKey(date)) {
		dates[date] = dates[date]+1;
	} else {
		dates[date] = 1;
		datesList = null;
	}
}

static function removeDate(date : Date) {
	if (dates.ContainsKey(date)) {
		var count = dates[date];
		if (count > 1) {
			dates[date] = dates[date]-1;
		} else {
			dates.Remove(date);
			datesList = null; //nullify the old list so you have to recompute it.
		}
	}
}

//Returns an ordered list of unique dates with their x coordinates.
static function getDates(width : int) {
	if (datesList == null || width != lastWidth) {
		lastWidth = width;
		updateDates(width);
	} 
	return datesList;
}

static function getFirstDate() : Date {
	if (datesList == null) {
		updateDates(lastWidth);
	}
	return first_date;
}

static function getLastDate() : Date {
	if (datesList == null) {
		updateDates(lastWidth);
	}
	return last_date;
}

static function getTotalSeconds() : float {
	var first_date = getFirstDate();
	var last_date = getLastDate();
	return (last_date - first_date).TotalSeconds;
}

//Get the date that is ratio% of the way between the first and last dates.
static function ratioToDate(ratio : float) {
	var timeDiff = getTotalSeconds();
	var secondsAfterStart = (ratio * timeDiff);
	return first_date.AddSeconds(secondsAfterStart);
}

static function dateToRatio(date : Date) : float{
	var timeDiff = getTotalSeconds();
	var thisDiff = (date - getFirstDate()).TotalSeconds;
	return thisDiff/timeDiff;
}

static function updateDates(width : int) {
	datesList = new List.<DateRatio>();

	//Calculate the first and last dates and find the difference in seconds.
	var allDates = dates.Keys;

	first_date = last_date = TimeObject.DEFAULT_DATE;

	//Update first and last dates
	var on_first = true;
	for (var date in dates.Keys) {
		if (on_first) {
			first_date = date;
			on_first = false;
		}
		last_date = date;
	}

	var timeDiff : float = (last_date-first_date).TotalSeconds;

	for (var date in allDates) {
		var thisDiff : float = (date-first_date).TotalSeconds;
		var ratio : float = thisDiff * 1.0 / timeDiff;
		datesList.Add(new DateRatio(date, ratio));
	}

}

static function validateAllTimeObjects() {
	for (var file in FileManager.files) {
		for (var node in file.nodes.Values) {
			node.validateDate();
		}
	}
	ClusterController.ReInit();
	CentralityController.ReInit();
	ColorController.handleDateChange();
}

static function skipToNext() {
	for (var date in dates.Keys) {
		if (date > current_date) {
			setCurrentDate(date);
			break;
		}
	}
}

static function skipToPrev() {
	var on_first = true;
	var prev_date : Date;
	for (var date in dates.Keys) {
		if (on_first) {
			on_first = false;
			prev_date = date;
		}
		if (date >= current_date) {
			setCurrentDate(prev_date);
			break;
		}
		prev_date = date;
	}
}


//wrapper class for Date and x-coordinate in the width given in getDates 
private class DateRatio {
	var date : Date;
	var ratio : float;

	public function DateRatio (date : Date, x : float) {
		this.date = date;
		this.ratio = x;
	}
}