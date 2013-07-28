var column_name :String;
var column_index : int;
var is_numeric : boolean; //true for number, false otherwise.
var is_shown : boolean = false; //for display on the screen.

var is_pkey : boolean = false;

var file : DataFile; //the file to which this attribute belongs

function ToggleShown(){
	is_shown = !is_shown;
	file.UpdateShownIndices();
}

function TogglePkey(){
	//TODO runtime pkey switching.
	is_pkey = !is_pkey;
}