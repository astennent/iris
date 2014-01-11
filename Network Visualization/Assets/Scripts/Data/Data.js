#pragma strict

//Extended by Connection and Node through TimeObject
class Data extends MonoBehaviour {

	//Used by Node and Connection.
	var source : DataFile;
	protected var initialized = false;

	private var attr_dict = new Dictionary.<Attribute, Datum>();
	private var index_dict = new Dictionary.<int, Datum>();

	//Default Constructor
	public function Data(){}

	//set an attribute 
	function Set(attribute : Attribute, value : String) {
		var datum = new Datum(attribute, value);
		attr_dict[attribute] = datum;
		index_dict[attribute.column_index] = datum;
	}

	function Get(attribute : Attribute) {
		return attr_dict[attribute].getValue();
	}

	function GetNumeric(attribute : Attribute) {
		return attr_dict[attribute].getNumericValue();
	}

	function Get(index : int) {
		return index_dict[index].getValue();
	}

	function GetNumeric(index : int) {
		return index_dict[index].getNumericValue();
	}

	//Used for enumerating over the dict.
	function getDict() {
		return attr_dict;
	}
	function getIndexDict() {
		return index_dict;
	}

	//Used for the construction of Connections.
	function CopyData(other : Data) {
		if (other != null) {
			this.attr_dict = other.getDict();
			this.index_dict = other.getIndexDict();
		}
	}

	function Count(){
		return attr_dict.Count;
	}
}