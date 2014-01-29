#pragma strict

private var keyPairs = new List.<List.<Attribute> >(); //array of tuples. [ [from,to] [from,to] [from,to]...]
var from_file : DataFile; //
var to_file : DataFile;
var source_file : DataFile;
var isBidirectional : boolean = false;
var activated : boolean = false;

private var weightAttribute : Attribute = null;
private var weightModifier : float = 1.0;
var weightInverted = false;
static var MIN_WEIGHT_MODIFIER : float = 0.01;
static var MAX_WEIGHT_MODIFIER : float = 10;

//The other connection if this is a linking table.
private var linkedFKey : ForeignKey;


class ForeignKey {

	public function ForeignKey(from_file : DataFile, to_file : DataFile, source_file : DataFile) {
		this.from_file = from_file;
		this.to_file = to_file;
		this.source_file = source_file; //equal to from_file with non-linking tables.
	}

	//add a from/to keyPair pair. 
	function addKeyPair(from : Attribute, to : Attribute){
		var tuple = new List.<Attribute>();
		tuple.Add(from);
		tuple.Add(to);

		//Update aspect
		from.setAspect(Attribute.FOREIGN_KEY, true);

		keyPairs.Add(tuple);
		activated = true;
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
		checkActivated();
	}

	function checkActivated(){
		if (keyPairs.Count == 0 && activated){
			activated = false;
			from_file.demoteFkey(this);
		} else if (keyPairs.Count > 0 && !activated){
			activated = true;
			from_file.promoteFkey(this);
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
				var other_attribute = to_file.attributes[other_file_pkey_indices[attr_index]]; //oof
				if (fkey_to_attribute != other_attribute) {
					return false;
				}
			}
		}
		return true;
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
 
	//Only set by id so that you can only have weights from the "from" file.
	function setWeightAttributeIndex(weightAttributeIndex : int) {
		if (weightAttributeIndex == -1) {
			this.weightAttribute = null;
		} else {
			this.weightAttribute = from_file.attributes[weightAttributeIndex];
			weightAttribute.invalidateMinMax();
		}

		if (linkedFKey != null && linkedFKey.getWeightAttribute() != weightAttribute) {
			linkedFKey.setWeightAttributeIndex(weightAttributeIndex);
		} 
	}

	function setLinkedFKey(linkedFKey : ForeignKey) {
		this.linkedFKey = linkedFKey;
	}

	function isLinking() {
		return source_file.linking_table;
	}

}