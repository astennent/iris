#pragma strict

private var rule_type : int;
private var sources : HashSet.<DataFile> = new HashSet.<DataFile>(); //stores name of source
private var cluster_id : int; //stores id of cluster
private var node_pkey : Array;

private var attribute : Attribute; //stores which attribute you're looking at
private var attribute_value : String = "";

var is_fallback : boolean; //is this the "default" rule?

var color : Color;
var variation : float;

var halo : boolean;
var halo_always_on : boolean;

var colorController : ColorController;

var uses_scheme : boolean = false;
var scheme_button_color : Color; //used for coloring the scheme button so it doesn't flash.
private var scheme_index : int = 0; //bright

function Init(){
	rule_type = 0; //SOURCE

	node_pkey = null;
	cluster_id = -1;

	colorController = GameObject.FindGameObjectWithTag("GameController").GetComponent(ColorController);
	color = colorController.GenRandomColor(scheme_index); //BRIGHT
	scheme_button_color = color;
	variation = 0.3;
}

function getColor(){
	if (uses_scheme) {
		return colorController.GenRandomColor(scheme_index);
	} else {
		return color;
	}
}

function setScheme(index : int){
	scheme_index = index;
	color = colorController.GenRandomColor(scheme_index);
	scheme_button_color = color;
	colorController.ApplyRule(this);
}

function getScheme() {
	return scheme_index;
}

function setRuleType(index : int) {
	rule_type = index;
	colorController.ApplyRule(this);
}

function getRuleType() {
	return rule_type;
}

function getDisplayName() : String{
	if (is_fallback){
		return "Fallback Scheme -- X";
	}

	if (rule_type == 0){ //SOURCE
		var count = sources.Count;
		if (count == 0){
			return "New Source Rule";
		} else if (count == 1) {
			var enumerator = sources.GetEnumerator();
			enumerator.MoveNext();
			return enumerator.Current.shortName() + "";
		} else {
			return sources.Count + " sources";
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

	return "New Rule";
}

function usesSource(input : DataFile){
	return sources.Contains(input);
}

function addSource(input : DataFile){
	sources.Add(input);
}

function removeSource(input : DataFile){
	sources.Remove(input);
}

function getSources(){
	return sources;
}

function toggleSource(input : DataFile) {
	if (usesSource(input)) {
		removeSource(input);
	} else {
		addSource(input);
	}
}

function getClusterId(){
	return cluster_id;
}

function setClusterId(input : int){
	cluster_id = input;
}

function getNodePkey(){
	return node_pkey;
}

function setNodePKey(input : Array){
	node_pkey = input;
}

function getAttribute(){
	return attribute;
}

function setAttribute(input : Attribute){
	attribute = input;
}

function getAttributeValue(){
	return attribute_value;
}

function setAttributeValue(input : String) {
	attribute_value = input;
}

