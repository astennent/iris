#pragma strict

private var timeSeriesEnabled = false;

function getEnabled() {
	return timeSeriesEnabled;
}

function setEnabled(timeSeriesEnabled : boolean) {
	this.timeSeriesEnabled = timeSeriesEnabled;
}