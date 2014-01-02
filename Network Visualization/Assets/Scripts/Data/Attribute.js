#pragma strict

private var column_name :String;
private var defaultNumeric : float = 0;

var column_index : int;
var is_shown : boolean = false; //for display on the screen.

var is_pkey : boolean = false;

var file : DataFile; //the file to which this attribute belongs

var restrictedNameCache = new Dictionary.<int, String>();

static var NORMAL = 0;
static var FOREIGN_KEY = 1;
static var TIMESERIES = 2;
static var GIS = 3;

private var aspect = 0;
static var aspectColors = [Color.white, //Normal
						new Color(1, .5, 0), //FKey
						new Color(.2, 1, .5), // Time Series
						new Color(1, 0, .5) //GIS
						];
static var shownColor = new Color(1, 1, .5);
static var pkeyColor = new Color(1, .5, .5);

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

	function getAspect() {
		return aspect;
	}

	function getAspectColor() {
		if (aspect == 0) {
			if (is_shown && is_pkey) {
				return mergeColors(shownColor, pkeyColor);
			} else if (is_shown) {
				return shownColor;
			} else if (is_pkey) {
				return pkeyColor;
			}
			return aspectColors[0];
		} else {
			return aspectColors[aspect];
		}
	}

	function mergeColors(one : Color, two : Color) {
		var r = (one.r + two.r)/2;
		var g = (one.g + two.g)/2;
		var b = (one.b + two.b)/2;
		return new Color(r, g, b);
	}

	function setAspect(aspect : int) {
		//TOOD: Validate.
		this.aspect = aspect;
	}

}