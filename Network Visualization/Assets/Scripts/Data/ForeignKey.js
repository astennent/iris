#pragma strict

private var keyPairs = new List.<List.<Attribute> >(); //array of tuples. [ [from,to] [from,to] [from,to]...]
var from_file : DataFile; //
var to_file : DataFile;
var isBidirectional : boolean = false;
var activated : boolean = false;
var weightModifier : float = 1.0;

class ForeignKey {

	public function ForeignKey(from_file : DataFile, to_file : DataFile) {
		this.from_file = from_file;
		this.to_file = to_file;
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

}