#pragma strict

private var keyPairs = new List.<Attribute[] >(); //array of tuples. [ [from,to] [from,to] [from,to]...]
var keyPairIds = new List.<List.<int> >(); //matching array of attribute tuples for serialization

private var from_file : DataFile; 
private var to_file : DataFile;
private var source_file : DataFile;

// Keep track of the file id's for serialization.
var from_file_id : int; 
var to_file_id : int;
var source_file_id : int;

var isBidirectional : boolean = false;

var weightAttribute : Attribute = null;
var weightModifier : float = 1.0;
var weightInverted = false;

var usingCustomColor = false;
var color = Color.white;

static var MIN_WEIGHT_MODIFIER : float = 0.01;
static var MAX_WEIGHT_MODIFIER : float = 10;

var uuid : int; 

class ForeignKey {

	public function ForeignKey() {} // Default constructor required for serialization.

	public function ForeignKey(source_file : DataFile) {
		this.source_file = source_file; 
		source_file_id = source_file.uuid;
		uuid = WorkspaceManager.generateUUID();
	}

	function setFromFile(file : DataFile) {
		from_file = file;
		from_file_id = (from_file != null) ? from_file.uuid : 0;
		removeAllKeyPairs();
	}

	function setToFile(file : DataFile) {
		this.to_file = file;
		to_file_id = (to_file != null) ? to_file.uuid : 0;
		removeAllKeyPairs();
	}

	//add a from/to keyPair pair. 
	function addKeyPair(from : Attribute, to : Attribute){
		var tuple = new Attribute[2];
		tuple[0] = from;
		tuple[1] = to;
		keyPairs.Add(tuple);

		//Inform the attributes involved that they have another foreign key associated with it.
		from.associateForeignKey(this, true);
		to.associateForeignKey(this, false);
	}

	function removeKeyPair(from : Attribute, to : Attribute){
		for (var index = 0 ; index < keyPairs.Count ; index++){
			var tuple = keyPairs[index];
			if (tuple[0] == from && tuple[1] == to){
				removeKeyPair(index);
				return;
			}
		}
	}

	function removeKeyPair(index : int) {
		//Inform the attributes involved that they are no longer associated with this foreign key.
		keyPairs[index][0].disassociateForeignKey(this, true);
		keyPairs[index][1].disassociateForeignKey(this, false);

		keyPairs.RemoveAt(index);
	}

	function removeAllKeyPairs() {
		//Removes all key pairs first, to ensure that attributes are properly notified of removal.
		while (keyPairs.Count > 0) {
			removeKeyPair(0);
		}
	}

	function getKeyPairs(){
		return keyPairs;
	}

	function isSimpleFkey(from : Attribute, to : Attribute){
		return (isLinking()) ? false : (keyPairs.Count == 1 && keyPairs[0][0] == from && keyPairs[0][1] == to);
	}

	//check if the key maps directly onto the target file's primary key. 
	//This allows for O(1) mapping, rather than O(n).
	function mapsToPrimary(){
		var other_file_pkey_indices = to_file.pkey_indices;
		if (other_file_pkey_indices.length == keyPairs.Count) {
			for (var attr_index = 0 ; attr_index < other_file_pkey_indices.length; attr_index++) {
				var fkey_to_attribute = keyPairs[attr_index][1];
				var other_attribute = to_file.getAttribute(other_file_pkey_indices[attr_index]); //oof
				if (fkey_to_attribute != other_attribute) {
					return false;
				}
			}
			return true;
		}
		return false;
	}

	function getWeightModifier() {
		return weightModifier;
	}
	function setWeightModifier(weightModifier : float) {
		this.weightModifier = weightModifier;
	}

	function isWeightInverted() {
		return weightInverted;
	}
	function setWeightInverted(weightInverted : boolean) {
		this.weightInverted = weightInverted;
	}

	function getWeightAttribute() {
		return weightAttribute;
	}
	function getWeightAttributeIndex() {
		return (weightAttribute != null) ? weightAttribute.column_index : -1;
	}
 
	//This can only be set by id (instead of attribute itself) so that you can only have weights from the "source" file.
	function setWeightAttributeIndex(weightAttributeIndex : int) {
		this.weightAttribute = (weightAttributeIndex >= 0 && source_file != null) 
			? source_file.getAttribute(weightAttributeIndex)
			: null;
	}

	function isLinking() {
		return source_file.linking_table;
	}

	function isUsingCustomColor() {
		return usingCustomColor;
	}

	function setUsingCustomColor(usingCustomColor : boolean) {
		if (usingCustomColor == this.usingCustomColor) {
			return;
		}
		this.usingCustomColor = usingCustomColor;
		updateEdgeColors();
	}

	function setColor(color : Color) {
		if (color == this.color) {
			return;
		}

		this.color = color;
		if (usingCustomColor) {
			updateEdgeColors();
		}
	}

	function updateEdgeColors() {
		var relevantFile = (isLinking()) ? to_file : from_file;
		var nodes = relevantFile.getNodes();
		for (var node in nodes) {
			var edges = node.getEdges(false);
			for (var edge in edges) {
				if (edge.foreignKey == this) {
					edge.updateColor();
				}
			}
		}
	}

	function getToFile() {
		return to_file;
	}

	function getFromFile() {
		return from_file;
	}

	function getSourceFile() {
		return source_file;
	}

	function OnWorkspaceLoad() {
		from_file = FileManager.getFileFromUUID(from_file_id);
		to_file = FileManager.getFileFromUUID(to_file_id);
		source_file = FileManager.getFileFromUUID(source_file_id);

		for (var keyPair in keyPairIds) {
			var attr1 = FileManager.getAttributeFromUUID(keyPair[0], source_file);
			var attr2 = FileManager.getAttributeFromUUID(keyPair[1]);
			addKeyPair(attr1, attr2);
		}
	}
}