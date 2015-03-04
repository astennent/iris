#pragma strict

var column_name :String;
var is_shown : boolean = false; //for display on the screen.
var is_pkey : boolean = false;

var file_uuid : int; //uuid of the file to which this attribute belongs

private var m_restrictedNameCache = new Dictionary.<int, String>();

static var FKEY_COLOR = new Color(1, .5, 0);
static var PKEY_COLOR = new Color(1, .5, .5);
static var SHOWN_COLOR = new Color(1, 1, .5);
static var TIME_SERIES_COLOR = new Color(.2, 1, .5);

@System.NonSerialized
private var associatedForeignKeysFrom = new HashSet.<ForeignKey>();
@System.NonSerialized
private var associatedForeignKeysTo = new HashSet.<ForeignKey>();

//TimeFrame variables
var timeFrameFormat : String = "";
private var validTimeFrameFormat : boolean = false;
private var timeFrameFormatWarning : String = "";

var uuid;

class Attribute extends Stats {

	//Default Constructor required for serialization
	public function Attribute() {	}

	//Constructor
	public function Attribute(file : DataFile, column_name : String, column_index : int) {
		this.file_uuid = file.uuid;
		m_file = file;
		this.column_index = column_index;
		this.column_name = column_name;
		super(); // base constructor
		uuid = WorkspaceManager.generateUUID();
	}

	function ToggleShown(){
		is_shown = !is_shown;
		m_file.updateNodeNames();
	}

	function TogglePkey(){
		if (!m_file.isActivated() && !m_file.isActivating()) {
			is_pkey = !is_pkey;
		}
	}

	function getRestrictedName(pixels : int) {
		if (pixels < 10) {
			return "";
		}
		if (!(pixels in m_restrictedNameCache)){
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
			m_restrictedNameCache[pixels] = restrictedName;
		}
		return m_restrictedNameCache[pixels];
	}

	function getColumnName(){
		return column_name;
	}

	function setColumnName(new_name : String) {
		if (new_name != column_name) {
			column_name = new_name;
			m_restrictedNameCache = new Dictionary.<int, String>();
		}
	}

	function setDefaultNumeric(defaultNumeric : float) {
		this.defaultNumeric = defaultNumeric;
	}

	function getDefaultNumeric() {
		return defaultNumeric;
	}

	function getAspectColor() : Color {
		var colors = new List.<Color>();

		if (is_shown) {
			colors.Add(SHOWN_COLOR);
		}

		if (is_pkey) {
			colors.Add(PKEY_COLOR);
		}

		if (associatedForeignKeysFrom.Count > 0) {
			colors.Add(FKEY_COLOR);
		}

		if (m_file.timeFrame.usesAttribute(this)) {
			colors.Add(TIME_SERIES_COLOR);
		}

		return ColorController.mergeColors(colors);
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
		if (m_file.timeFrame != null) { //This should only be false on startup.
			m_file.timeFrame.updateValid();
		}
	}
	function hasValidTimeFrameFormat() {
		return validTimeFrameFormat;
	}

	// A "Simple FKey" is defined as a foreign key that originates from this file, using only this attribute.
	function getSimpleFKeys() {
		var output = new List.<ForeignKey>();
		for (var fkey in associatedForeignKeysFrom) {
			if (fkey.getKeyPairs().Count == 1) {
				output.Add(fkey);
			}
		}
		return output;
	}

	function associateForeignKey(foreignKey : ForeignKey, isFrom : boolean) {
		if (isFrom) {
			associatedForeignKeysFrom.Add(foreignKey);
		} else {
			associatedForeignKeysTo.Add(foreignKey);
		}
	}
	function disassociateForeignKey(foreignKey : ForeignKey, isFrom : boolean) {
		if (isFrom) {
			associatedForeignKeysFrom.Remove(foreignKey);
		} else {
			associatedForeignKeysTo.Remove(foreignKey);
		}
	}

	function getFile() {
		return m_file;
	}

	function OnWorkspaceLoad() {
		m_file = FileManager.getFileFromUUID(file_uuid);
		setTimeFrameFormat(timeFrameFormat);
	}

}