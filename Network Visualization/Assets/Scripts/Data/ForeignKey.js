#pragma strict

private var keyPairs = new List.<List.<Attribute> >(); //array of tuples. [ [from,to] [from,to] [from,to]...]
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
static var MIN_WEIGHT_MODIFIER : float = 0.01;
static var MAX_WEIGHT_MODIFIER : float = 10;

var uuid : int; 

class ForeignKey {

	public function ForeignKey() {} // Default constructor required for serialization.

	public function ForeignKey(from_file : DataFile, to_file : DataFile, source_file : DataFile) {
		this.from_file = from_file;
		this.to_file = to_file;
		this.source_file = source_file; //equal to from_file with non-linking tables.

		from_file_id = from_file.uuid;
		to_file_id = to_file.uuid;
		source_file_id = source_file.uuid;

		uuid = WorkspaceManager.generateUUID();
	}

	//add a from/to keyPair pair. 
	function addKeyPair(from : Attribute, to : Attribute){
		var tuple = new List.<Attribute>();
		tuple.Add(from);
		tuple.Add(to);
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

	function deactivate() {
		//Removes all key pairs first, to ensure that attributes are properly notified of removal.
		while (keyPairs.Count > 0) {
			removeKeyPair(0);
		}
	}

	function getKeyPairs(){
		return keyPairs;
	}

	function isSimpleFkey(from : Attribute, to : Attribute){
		return keyPairs.Count == 1 && keyPairs[0][0] == from && keyPairs[0][1] == to;
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
		var linkedFKey = getLinkedFKey();
		if (linkedFKey != null && linkedFKey.getWeightModifier() != weightModifier) {
			linkedFKey.setWeightModifier(weightModifier);
		}
	}

	function isWeightInverted() {
		return weightInverted;
	}
	function setWeightInverted(weightInverted : boolean) {
		this.weightInverted = weightInverted;
		var linkedFKey = getLinkedFKey();
		if (linkedFKey != null && linkedFKey.isWeightInverted() != weightInverted) {
			linkedFKey.setWeightInverted(weightInverted);
		}
	}



	function getWeightAttribute() {
		return weightAttribute;
	}
	function getWeightAttributeIndex() {
		if (weightAttribute == null) {
			return -1;
		}
		return weightAttribute.column_index;
	}
 
	//This can only be set by id (instead of attribute itself) so that you can only have weights from the "from" file.
	function setWeightAttributeIndex(weightAttributeIndex : int) {
		this.weightAttribute = (weightAttributeIndex == -1) ? null :  from_file.getAttribute(weightAttributeIndex);

		var linkedFKey = getLinkedFKey();
		if (linkedFKey != null && linkedFKey.getWeightAttribute() != weightAttribute) {
			linkedFKey.setWeightAttributeIndex(weightAttributeIndex);
		} 
	}

	function getLinkedFKey() {
		if (!isLinking()) {
			return null;
		}

		// We assume here that that a linking table has exactly 2 foreign keys.
		// Note that this may eventually be an invalid assumption.
		return (source_file.foreignKeys[0] == this) ? source_file.foreignKeys[1] : source_file.foreignKeys[0]; 

	}

	function isLinking() {
		return source_file.linking_table;
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
			var attr1 = FileManager.getAttributeFromUUID(keyPair[0], from_file);
			var attr2 = FileManager.getAttributeFromUUID(keyPair[1], to_file);
			addKeyPair(attr1, attr2);
		}
	}

}