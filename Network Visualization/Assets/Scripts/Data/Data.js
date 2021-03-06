#pragma strict

//Extended by Edge and Node through TimeObject
class Data extends MonoBehaviour {

	//Used by Node and Edge.
	protected var source : DataFile;

	private var attr_dict = new Dictionary.<Attribute, Datum>();
	private var index_dict = new Dictionary.<int, Datum>();

	// Abstract away the source of the data, allowing for non-linking 
	// edges to share their parent's data without redundancy.
	private var dataSource : Data = this;

	//Used for whenever data should not be duplicated.
	public function setDataSource(dataSource : Data) {
		this.dataSource = dataSource;
	}

	public function getSource() {
		return source;
	}

	//set an attribute 
	function Set(attribute : Attribute, value : String) {
		var datum = new Datum(attribute, value);
		dataSource.attr_dict[attribute] = datum;
		dataSource.index_dict[attribute.column_index] = datum;
		
		// The attribute's statistics will be recalculated when requested
		attribute.invalidate(); 
	}

	function Get(attribute : Attribute) {
		return dataSource.attr_dict[attribute].getValue();
	}

	function GetNumeric(attribute : Attribute) {
		return dataSource.attr_dict[attribute].getNumericValue();
	}

	function Get(index : int) {
		return dataSource.index_dict[index].getValue();
	}

	function GetNumeric(index : int) {
		return dataSource.index_dict[index].getNumericValue();
	}

	//Used for enumerating over the dict.
	function getDict() {
		return dataSource.attr_dict;
	}
	function getIndexDict() {
		return dataSource.index_dict;
	}

	//Used for the construction of Edges.
	function CopyData(other : Data) {
		if (other != null) {
			dataSource.attr_dict = other.getDict();
			dataSource.index_dict = other.getIndexDict();
		}
	}

	function Count(){
		return dataSource.attr_dict.Count;
	}
}