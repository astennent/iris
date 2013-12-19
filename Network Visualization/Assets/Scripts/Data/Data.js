#pragma strict
//Owned by Nodes and Connections. 
class Data {

	private var dict = new Dictionary.<Attribute, Datum>();

	//set an attribute 
	function setValue(attribute : Attribute, value : String) {
		dict[attribute] = new Datum(attribute, value);
	}

	function setValue(attribute : Attribute, value : float) {
		dict[attribute] = new Datum(attribute, value);
	}

	function getValue(attribute : Attribute) {
		if (dict.ContainsKey(attribute)) {
			return dict[attribute].getValue();
		} else {
			return null;
		}
	}

	function getNumericValue(attribute : Attribute) {
		if (dict.ContainsKey(attribute)) {
			return dict[attribute].getNumericValue();
		} else {
			return null;
		}
	}

	//Loop over elements and make sure that they are the same as the other key.
	function compareTo(other : Data) {
		
	}




}