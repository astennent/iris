#pragma strict
//Used in collections of Data

public class Datum {

	private var attribute : Attribute;
	private var value : String;
	private var numericValue : float;

	//Constructor
	public function Datum(attribute : Attribute, value : String) {
		this.attribute = attribute;
		setValue(value);
	}

	//Update the value stored, along with all data types.
	function setValue(value : String) {
		this.value = value;
		this.numericValue = computeNumeric(value);
	}
	function setValue(value : float) {
		this.value = ""+value;
		this.numericValue = value;
	}

	function getValue() {
		return value;
	}
	function getNumericValue(){
		return numericValue;
	}

	//Attempts to find the numeric value of the string value.
	function computeNumeric(value : String) {
		try {
			return float.Parse(value);
		} catch (err){
			return attribute.getDefaultNumeric();
		}
	}

}