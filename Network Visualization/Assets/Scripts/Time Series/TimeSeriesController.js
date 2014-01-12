#pragma strict

private var timeSeriesEnabled = false;
private var dates = new SortedDictionary.<Date, int>();

private var datesList : List.<DateRatio>;
private var lastWidth : int = 1;

private var first_date : Date;
private var last_date : Date;

var current_date : Date;


function getEnabled() {
	return timeSeriesEnabled;
}

function toggleEnabled() {
	setEnabled(!timeSeriesEnabled);
}
function setEnabled(timeSeriesEnabled : boolean) {
	this.timeSeriesEnabled = timeSeriesEnabled;
}

function addDate(date : Date) {
	if (dates.ContainsKey(date)) {
		dates[date] = dates[date]+1;
	} else {
		dates[date] = 1;
		datesList = null;
	}
}

function removeDate(date : Date) {
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
function getDates(width : int) {
	if (datesList == null || width != lastWidth) {
		lastWidth = width;
		updateDates(width);
	} 
	return datesList;
}

function getFirstDate() : Date {
	if (datesList == null) {
		updateDates(lastWidth);
	}
	return first_date;
}

function getLastDate() : Date {
	if (datesList == null) {
		updateDates(lastWidth);
	}
	return last_date;
}

function getTotalSeconds() : float {
	var first_date = getFirstDate();
	var last_date = getLastDate();
	return (last_date - first_date).TotalSeconds;
}

//Get the date that is ratio% of the way between the first and last dates.
function ratioToDate(ratio : float) {
	var timeDiff = getTotalSeconds();
	var secondsAfterStart = (ratio * timeDiff);
	return first_date.AddSeconds(secondsAfterStart);
}

function dateToRatio(date : Date) : float{
	var timeDiff = getTotalSeconds();
	var thisDiff = (date - getFirstDate()).TotalSeconds;
	return thisDiff/timeDiff;
}

function updateDates(width : int) {
	datesList = new List.<DateRatio>();

	//Calculate the first and last dates and find the difference in seconds.
	var allDates = dates.Keys;

	first_date = TimeObject.DEFAULT_START_DATE;
	last_date = TimeObject.DEFAULT_END_DATE;

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

//wrapper class for Date and x-coordinate in the width given in getDates 
private class DateRatio {
	var date : Date;
	var ratio : float;

	public function DateRatio (date : Date, x : float) {
		this.date = date;
		this.ratio = x;
	}
}