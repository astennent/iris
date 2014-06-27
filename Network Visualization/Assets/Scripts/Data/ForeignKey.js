#pragma strict

private var keyPairs = new List.<List.<Attribute> >(); //array of tuples. [ [from,to] [from,to] [from,to]...]


private var from_file : DataFile; 
private var to_file : DataFile;
private var source_file : DataFile;

// Keep track of the file id's for serialization.
var from_file_id : int; 
var to_file_id : int;
var source_file_id : int;

var isBidirectional : boolean = false;

private var weightAttribute : Attribute = null;
private var weightModifier : float = 1.0;
var weightInverted = false;
static var MIN_WEIGHT_MODIFIER : float = 0.01;
static var MAX_WEIGHT_MODIFIER : float = 10;

//The other edge if this is a linking table.
private var linkedFKey : ForeignKey;
var linkedFkeyId : int;

//TODO: Create a ForeignKeyManager to handle uuids and linked fkeys?

var uuid : int; //

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

		//Update aspect
		from.setAspect(Attribute.FOREIGN_KEY, true);

		keyPairs.Add(tuple);
	}

	function removeKeyPair(from : Attribute, to : Attribute){
		for (var i = 0 ; i < keyPairs.Count ; i++){
			var tuple = keyPairs[i];
			if (tuple[0] == from && tuple[1] == to){
				removeKeyPair(i);
			}
		}
	}

	function removeKeyPair(index : int){
		keyPairs.RemoveAt(index);
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
		if (linkedFKey != null && linkedFKey.getWeightModifier() != weightModifier) {
			linkedFKey.setWeightModifier(weightModifier);
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
		if (weightAttributeIndex == -1) {
			this.weightAttribute = null;
		} else {
			this.weightAttribute = from_file.getAttribute(weightAttributeIndex);
		}

		if (linkedFKey != null && linkedFKey.getWeightAttribute() != weightAttribute) {
			linkedFKey.setWeightAttributeIndex(weightAttributeIndex);
		} 
	}

	function setLinkedFKey(linkedFKey : ForeignKey) {
		this.linkedFKey = linkedFKey;
		linkedFkeyId = linkedFKey.uuid;
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

}