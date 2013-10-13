#pragma strict

private var column_name :String;
var column_index : int;
var is_numeric : boolean; //true for number, false otherwise.
var is_shown : boolean = false; //for display on the screen.

var is_pkey : boolean = false;

var file : DataFile; //the file to which this attribute belongs

var restrictedNameCache = new Dictionary.<int, String>();

function ToggleShown(){
	is_shown = !is_shown;
	file.UpdateShownIndices();
}

function TogglePkey(){
	//TODO runtime pkey switching.
	is_pkey = !is_pkey;
}

//TODO: make this cut out the middle, not the end.
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