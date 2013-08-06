#pragma strict

var rule_type : int;
var source : DataFile; //stores name of source
var cluster_id : int; //stores id of cluster
var node_pkey : Array;
var attribute : Attribute; //stores which attribute you're looking at
var attribute_value : String = "";

var color_scheme : int = 0;
var color : Color;
var variation : float;

var colorController : ColorController;

function Init(){
	rule_type = 0; //SOURCE

	source = null;
	node_pkey = null;
	cluster_id = -1;

	colorController = GameObject.FindGameObjectWithTag("GameController").GetComponent(ColorController);
	color_scheme = 0; //BRIGHT
	color = colorController.GenRandomColor(color_scheme);
	variation = 0.3;
}

function setScheme(index : int){
	color = colorController.GenRandomColor(index);
	color_scheme = index;
}

function getDisplayName(){
	if (rule_type == 0){ //SOURCE
		if (source == null){
			return "New Source Rule";
		} else {
			return source.shortName();
		}
	} else if (rule_type == 1){
		if (cluster_id == -1){
			return "New Cluster Rule";
		} else {
			return "Cluster " + cluster_id;
		}
	} else if (rule_type == 2){
		if (node_pkey == null){
			return "New Node Rule";
		} 
	} else if (rule_type == 3){
		if (attribute == null){
			return "New Attribute Rule";
		} else {
			return attribute.column_name + ": " + attribute_value;
		}
	}

	//fallback
	return "New Rule";
}

