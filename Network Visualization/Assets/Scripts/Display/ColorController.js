#pragma downcast

private var networkController : NetworkController;
private var clusterController : ClusterController;
private var fileManager : FileManager;

private var mode : int = 0;
var RANDOM : int = 0;
var BY_CLUSTER : int = 1;
var BY_SOURCE : int = 2;


var scheme : int = 1; //default to bright colors.
var button_color : Color;
private var schemes = ["Bright", "Pastel", "Grayscale", "Rust", "Sunlight", "Forest Glade", 
					"Aqua"];

var rules : Array = new Array();
var rule_types = ["Source", "Cluster", "Node", "Attribute"];
var colorRulePrefab : ColorRule;

function getSchemes(){
	return schemes;
}
function getSchemeName(){
	return schemes[scheme];
}
function getScheme(){
	return scheme;
}
function setScheme(s : int){
	scheme = s;
	ApplyColors();
	button_color = GenRandomColor();
}

function getMode(){
	return mode;
}
function setMode(m : int){
	mode = m;
}


function Start(){
	networkController = this.GetComponent(NetworkController);
	clusterController = this.GetComponent(ClusterController);
	fileManager = this.GetComponent(FileManager);
	setScheme(0);
}

function createRule(){
	var new_rule : ColorRule = GameObject.Instantiate(colorRulePrefab).GetComponent(ColorRule);
	new_rule.Init();
	rules.Push(new_rule);
}
function removeRule(i : int){
	rules.RemoveAt(i);
}
function moveRuleUp(i : int){
	if (i > 0){
		var temp = rules[i];
		rules[i] = rules[i-1];
		rules[i-1] = temp;
	}
}
function moveRuleDown(i : int){
	if (i < rules.length -1) {
		var temp = rules[i];
		rules[i] = rules[i+1];
		rules[i+1] = temp;
	}
}

function ApplyAllRules(){
	for (var x = 0; x < rules.length ; x++){
		ApplyRule(x);
	}
}

function ApplyRule(index : int) {
	var rule = rules[index].GetComponent(ColorRule);
	var color = rule.color;
	if (rule.rule_type == 0) {  //source
		if (rule.source != null) {
			ColorBySource(rule.source, color);
		}
	} else if (rule.rule_type == 1) { //cluster
		if (rule.cluster_id != -1) {
			ColorByCluster(rule.cluster_id, color);
		}
	} else if (rule.rule_type == 2) { //node
		//TODO
	} else if (rule.rule_type == 3){ //attr
		if (rule.attribute != null) {
			ColorByAttribute(rule.attribute, rule.attribute_value, color);
		}
	}
}

function ApplyColors(){
	if (mode == RANDOM){
		ColorRandom();
	} else if (mode == BY_CLUSTER){
		ColorByCluster();
	} else if (mode == BY_SOURCE){
		ColorBySource();
	}
	ApplyAllRules();
}

//Color all nodes randomly
function ColorRandom(){
	for (var file in fileManager.files){
		nodes = file.nodes;
		for (var entry in nodes){
			var node : Node = entry.Value;
			node.SetColor(GenRandomColor(), true);	
		}
	}
}

//Color nodes based on their groups.
function ColorByCluster(){
	var group_dict = clusterController.group_dict;
	var color_dict = {};
	for (var entry in group_dict){ //loop over the cluster ids
		var color : Color = GenRandomColor();
		ColorByCluster(entry.Key, color);
	}	
}
function ColorByCluster(cluster_id : int, color : Color){
	var nodes : Array = clusterController.group_dict[cluster_id];	
	for (var node in nodes){
		node.GetComponent(Node).SetColor(NudgeColor(color), true);
	}
}

//color nodes based on what file they came from.
function ColorBySource(){
	for (var file : DataFile in fileManager.files){
		var color : Color = GenRandomColor();
		ColorBySource(file, color);
	}
}
function ColorBySource(file : DataFile, color : Color){
	for (var node in file.nodes){
		node.Value.SetColor(NudgeColor(color), true);
	}
}

//color nodes based on a certain attribute value.
function ColorByAttribute(attribute : DataFileAttribute, value : String, color : Color){
	var file : DataFile = attribute.file;
	var attr_index : int = file.attributes.IndexOf(attribute);
	for (var node in file.nodes){
		if (""+node.Value.data[attr_index] == value) { 
			node.Value.SetColor(NudgeColor(color), true);
		}
	}
}

//Alters the color a small amount for variety.
function NudgeColor(c : Color){
	return NudgeColor(c, 0.3);
}

function NudgeColor(c : Color, dist : float){
	if (scheme == 2){
		dist = 0;
	}

	var red : float = c.r + Random.Range(-dist, dist);
	var green : float = c.g + Random.Range(-dist, dist);
	var blue : float = c.b + Random.Range(-dist, dist);
	return new Color(red, green, blue);	
}



function GenRandomColor(){
	return GenRandomColor(scheme);
}
function GenRandomColor(scheme_index : int){
	if (scheme_index == 0){ //bright
		return GenScaledColor(false);
	} else if (scheme_index == 1){ //pastel
		return GenScaledColor(true);
	} else if (scheme_index == 2) { //grayscale
		return GenGrayscale();
	} else if (scheme_index == 3) { //rust
		return NudgeColor(new Color(.72, .26, .05));
	} else if (scheme_index == 4) { //sunlight
		return NudgeColor(new Color(1, .7, 0));
	} else if (scheme_index == 5) { //forest glade
		return NudgeColor(new Color(.25, .75, .1));
	} else if (scheme_index == 6){ //aqua
		return NudgeColor(new Color(.1, .4, .75));
	}
}


function GenGrayscale(){
	var scale_number = Random.Range(0.0,1.0);
	return new Color(scale_number, scale_number, scale_number);
}

function GenScaledColor(pastel: boolean){
	if (pastel){
		var base = 0.5;
	} else {
		base = 0.0;
	}

	var scale_number = Random.Range(base,1.0);
	var scale_id = Random.Range(0,3); //0 1 or 2
	var r : float;
	var g : float;
	var b : float;

	if (scale_id == 0){
		r = scale_number;
		if (randBinary()){
			g = base; b = 1.0;
		} else {
			g = 1.0; b = base;
		}
	} else if (scale_id == 1){
		g = scale_number;
		if (randBinary()){
			r = base; b = 1.0;
		} else {
			r = 1.0; b = base;
		}
	} else {
		b = scale_number;
		if (randBinary()){
			g = base; r = 1.0;
		} else {
			g = 1.0; r = base;
		}
	}
	return new Color(r, g, b);
}

function randBinary(){ //true or false
	if (Random.Range(0,2) == 0){
		return true;
	} 
	return false;
}