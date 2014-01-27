#pragma strict

private var column_name :String;
private var defaultNumeric : float = 0;

var column_index : int;
var is_shown : boolean = false; //for display on the screen.

var is_pkey : boolean = false;

var file : DataFile; //the file to which this attribute belongs

var restrictedNameCache = new Dictionary.<int, String>();

static var FOREIGN_KEY = 0;
static var TIME_SERIES = 1;
static var GIS = 2;

private var aspects = new boolean[3];
static var aspectColors = [
						new Color(1, .5, 0), //FKey
						new Color(.2, 1, .5), // Time Series
						new Color(1, 0, .5) //GIS
						];

static var shownColor = new Color(1, 1, .5);
static var pkeyColor = new Color(1, .5, .5);


//TimeFrame variables
private var timeFrameFormat : String = "";
private var validTimeFrameFormat : boolean = false;
private var timeFrameFormatWarning : String = "";

private var minValue : float = 0;
private var maxValue : float = 0;
private var averageValue : float = 0;
private var sum : float = 0;
private var countValue : int = 0;
private var minMaxValid = false;


class Attribute {

	//Constructor
	public function Attribute(file : DataFile, column_name : String, column_index : int) {
		this.file = file;
		this.column_index = column_index;
		this.column_name = column_name;
	}

	function ToggleShown(){
		is_shown = !is_shown;
		file.UpdateShownIndices();
	}

	function TogglePkey(){
		//TODO runtime pkey switching.
		is_pkey = !is_pkey;
	}

	function getRestrictedName(pixels : int) {
		if (pixels < 10) {
			return "";
		}
		if (!(pixels in restrictedNameCache)){
			var restrictedName : String = column_name; 
			var had_to_adjust = false;
			while (true) {
				var content = new GUIContent(restrictedName);
				var size = GUI.skin.label.CalcSize(content);
				if (size.x < pixels-10) { //18 for the ...
					break;
				} else {
					restrictedName = restrictedName.Substring(0, restrictedName.Length*2/3) + restrictedName.Substring(restrictedName.Length*2/3+1);
					had_to_adjust = true;
				}
			}
			if (had_to_adjust) {
				restrictedName = restrictedName.Substring(0, restrictedName.Length*2/3) + "~" +  restrictedName.Substring(restrictedName.Length*2/3+1);
			}
			restrictedNameCache[pixels] = restrictedName;
		}
		return restrictedNameCache[pixels];
	}

	function getColumnName(){
		return column_name;
	}

	function setColumnName(new_name : String) {
		if (new_name != column_name) {
			column_name = new_name;
			restrictedNameCache = new Dictionary.<int, String>();
		}
	}

	function setDefaultNumeric(defaultNumeric : float) {
		this.defaultNumeric = defaultNumeric;
	}

	function getDefaultNumeric() {
		return defaultNumeric;
	}

	function getAspect(index : int) {
		return aspects[index];
	}

	function getAspectColor() {
		var colors = new List.<Color>();

		if (is_shown) {
			colors.Add(shownColor);
		}

		if (is_pkey) {
			colors.Add(pkeyColor);
		}

		for (var index = 0 ; index < aspects.length; index++) {
			if (aspects[index]) {
				colors.Add(aspectColors[index]);
			}
		}

		if (colors.Count == 0) {
			return Color.white;
		} else {
			return mergeColors(colors);
		}
	}

	function mergeColors(colors : List.<Color>) {

		var r = 0.0;
		var g = 0.0;
		var b = 0.0;

		for (var color in colors) {
			r += color.r;
			g += color.g;
			b += color.b;
		}

		var numColors = colors.Count;
		r /= numColors; 
		g /= numColors;
		b /= numColors;

		return new Color(r, g, b);
	}
	function setAspect(aspect : int, on : boolean) {
		aspects[aspect] = on;
	}


	function getTimeFramePresence(isStart : boolean) {
		return file.timeFrame.getPresence(this, isStart);
	}
	function getTimeFrameFormat() {
		return timeFrameFormat;
	}
	function getTimeFrameFormatWarning() {
		return timeFrameFormatWarning;
	}
	function setTimeFrameFormat(format : String) {
		this.timeFrameFormat = format;
		timeFrameFormatWarning = TimeParser.getFormatWarning(format);
		validTimeFrameFormat = (timeFrameFormatWarning == "");
		file.timeFrame.updateValid();
	}
	function hasValidTimeFrameFormat() {
		return validTimeFrameFormat;
	}

	function getSimpleFKeys() {
		var output = new List.<ForeignKey>();
		for (var fkey in file.getForeignKeys(true)) {
			var keyPairs = fkey.getKeyPairs();
			if (keyPairs.Count == 1 && keyPairs[0][0] == this) {
				output.Add(fkey);
			}
		}
		return output;
	}

	function updateMinMax() {
		updateMinMax(false);
	}
	function updateMinMax(force : boolean) {
		if (minMaxValid && !force) {
			return;
		}
		minValue = 0;
		maxValue = 0;
		averageValue = 0;
		sum = 0;
		countValue = 0;
		if (file.linking_table) { // There is no central location for connections 
									//in linking tables, so this is expensive.
			
			// Find all files that are be connected with the linking table.
			var filesToCheck = new HashSet.<DataFile>();
			for (var fkey in file.getForeignKeys(true)) {
				filesToCheck.Add(fkey.to_file);
			}

			//Loop over those files and check the relevant connections
			var checkedFiles = new HashSet.<DataFile>();
			for (var file in filesToCheck) {
				if (checkedFiles.Contains(file)) {
					continue;				
				} 

				for (var node in file.getNodes()) {
					for (var connection in node.getConnections(true)) {
						//check that the connection's data source is this file.
						if (connection.source == file) {
							updateMinMax(connection);
						}
					}
				}

				checkedFiles.Add(file);
			}
		} else {
			var nodes = file.getNodes();
			for (var node in nodes) {
				updateMinMax(node);
			}
		}
		averageValue = sum / countValue;
		minMaxValid = true;
	}

	//helper function called by the public one, uses connections or nodes.
	private function updateMinMax(data : Data) {
		var val = data.GetNumeric(this);
		if (val > maxValue) {
			maxValue = val;
		}
		if (val < minValue) {
			minValue = val;
		}
		sum+=val;
		countValue += 1;
	}

	function getMinValue() {
		if (!minMaxValid) {
			updateMinMax();
		}
		return minValue;
	}
	function getMaxValue() {
		if (!minMaxValid) {
			updateMinMax();
		}
		return maxValue;
	}
	function getAverageValue() {
		if (!minMaxValid) {
			updateMinMax();
		}
		return averageValue;
	}

	//TODO: make this called by time series changes and removing and adding nodes and connections.
	function invalidateMinMax() {
		minMaxValid = false;
	}

}