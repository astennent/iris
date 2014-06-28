#pragma strict

var column_name :String;
var column_index : int;
var is_shown : boolean = false; //for display on the screen.
var is_pkey : boolean = false;

var file_uuid : int; //uuid of the file to which this attribute belongs
private var file : DataFile;

private var restrictedNameCache = new Dictionary.<int, String>();

static var FOREIGN_KEY = 0;
static var TIME_SERIES = 1;
static var GIS = 2;

var aspects = new boolean[3];
static var aspectColors = [
						new Color(1, .5, 0), //FKey
						new Color(.2, 1, .5), // Time Series
						new Color(1, 0, .5) //GIS
						];

static var shownColor = new Color(1, 1, .5);
static var pkeyColor = new Color(1, .5, .5);

//TimeFrame variables
var timeFrameFormat : String = "";
private var validTimeFrameFormat : boolean = false;
private var timeFrameFormatWarning : String = "";

var uuid;

class Attribute extends Stats {

	//Default Constructor required for serialization
	public function Attribute(){
		setStatsAttribute(this);
	}

	//Constructor
	public function Attribute(file : DataFile, column_name : String, column_index : int) {
		this.file_uuid = file.uuid;
		this.file = file;
		this.column_index = column_index;
		this.column_name = column_name;
		setStatsAttribute(this);
		uuid = WorkspaceManager.generateUUID();
	}

	function ToggleShown(){
		is_shown = !is_shown;
		file.updateNodeNames();
	}

	function TogglePkey(){
		if (!file.isActivated() && !file.isActivating()) {
			is_pkey = !is_pkey;
		}
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
		for (var fkey in file.getForeignKeys()) {
			var keyPairs = fkey.getKeyPairs();
			if (keyPairs.Count == 1 && keyPairs[0][0] == this) {
				output.Add(fkey);
			}
		}
		return output;
	}

	function getFile() {
		return file;
	}

	// May want this to be in the constructor. TBD.
	function OnLoadComplete() {
		file = FileManager.getFileFromUUID(file_uuid);
		setTimeFrameFormat(timeFrameFormat);
	}

}