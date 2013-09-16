#pragma strict

private var networkController : NetworkController;
private var clusterController : ClusterController;
private var fileManager : FileManager;

var button_color : Color;
private var schemes = ["Bright", "Pastel", "Grayscale", "Rust", "Sunlight", "Forest Glade", 
					"Aqua"];

var rules : List.<ColorRule> = new List.<ColorRule>();
var rule_types = ["Source", "Cluster", "Node", "Attribute"];
var colorRulePrefab : ColorRule;

function getSchemeNames() {
	return schemes;
}

function Start(){
	networkController = this.GetComponent(NetworkController);
	clusterController = this.GetComponent(ClusterController);
	fileManager = this.GetComponent(FileManager);

	createRule();
	rules[0].is_fallback = true;
}

function createRule(){
	var new_rule : ColorRule = GameObject.Instantiate(colorRulePrefab).GetComponent(ColorRule);
	new_rule.Init();
	rules.Add(new_rule);
}
function removeRule(i : int){
	rules.RemoveAt(i);
}
function moveRuleUp(i : int){
	if (i > 1){
		var temp = rules[i];
		rules[i] = rules[i-1];
		rules[i-1] = temp;
	}
}
function moveRuleDown(i : int){
	if (i < rules.Count -1) {
		var temp = rules[i];
		rules[i] = rules[i+1];
		rules[i+1] = temp;
	}
}

function ApplyAllRules(){
	//reset all halos.
	for (var file : DataFile in fileManager.files){
		for (var entry in file.nodes){
			var node : Node = entry.Value;
			node.resetHaloColor();
		}
	}

	for (var x = 0; x < rules.Count ; x++){
		ApplyRule(x);
	}
}

function ApplyRule(index : int) {
	var rule = rules[index].GetComponent(ColorRule);
	ApplyRule(rule);
}

function ApplyRule(rule : ColorRule) {
	var color : Color = rule.getColor();
	var variation : float = rule.variation;
	var halo = rule.halo;
	var rule_type = rule.getRuleType();
	if (rule_type == 0) {  //source

		//the fallback rule transparently applies itself to all files.
		if (rule.is_fallback) {
			for (var source : DataFile in fileManager.files) {
				color = rule.getColor();
				ColorBySource(source, color, variation, halo);
			}
		} else { //seperate loops because dataManager stores DataFiles in a List, rather than a HashSet.
			for (var source : DataFile in rule.getSources()) {
				ColorBySource(source, color, variation, halo);
			}
		}


	} else if (rule_type == 1) { //cluster

		//the fallback rule transparently applies itself to all groups.
		if (rule.is_fallback) {
			for (var entry in clusterController.group_dict){ //loop over the cluster ids
				color = rule.getColor();
				ColorByCluster(entry.Key, color, variation, halo);
			}
		} else {
			if (rule.getClusterId() != -1) {
				ColorByCluster(rule.getClusterId(), color, variation, halo);
			}
		}

	} else if (rule_type == 2) { //node

		//the fallback rule transparently applies itself to all groups.
		if (rule.is_fallback) {
			for (var file in fileManager.files){
				var nodes = file.nodes;
				for (var entry in nodes){
					var node : Node = entry.Value;
					ColorNodeForRule(node, rule.getColor(), variation, halo);
				}
			}
		}

		//TODO non-fallback

	} else if (rule_type == 3){ //attr
		if (rule.getAttribute() != null) {
			ColorByAttribute(rule.getAttribute(), rule.getAttributeValue(), color, variation, halo);
		}
	}
}

/*//Color all nodes randomly
function ColorAllByNode(){
	for (var file in fileManager.files){
		nodes = file.nodes;
		for (var entry in nodes){
			var node : Node = entry.Value;
			node.SetColor(GenRandomColor(), true);	
		}
	}
}

//Color nodes based on their groups.
function ColorAllByCluster(){
	var group_dict = clusterController.group_dict;
	for (var entry in group_dict){ //loop over the cluster ids
		var color : Color = GenRandomColor();
		ColorByCluster(entry.Key, color, 0.3, false);
	}	
}*/

function ColorByCluster(cluster_id : int, color : Color, variation : float, halo : boolean){
	var nodes = clusterController.group_dict[cluster_id];	
	for (var node in nodes){
		ColorNodeForRule(node, color, variation, halo);
	}
}
/*
//color nodes based on what file they came from.
function ColorAllBySource(){
	for (var file : DataFile in fileManager.files){
		var color : Color = GenRandomColor();
		ColorBySource(file, color, 0.3, false);
	}
}
*/
function ColorBySource(file : DataFile, color : Color, variation : float, halo : boolean){
	for (var node in file.nodes){
		ColorNodeForRule(node.Value, color, variation, halo);
	}
}
//color nodes based on a certain attribute value.
function ColorByAttribute(attribute : Attribute, value : String, color : Color, variation : float, halo : boolean){
	var file : DataFile = attribute.file;
	var attr_index : int = file.attributes.IndexOf(attribute);
	for (var node in file.nodes){
		if (""+node.Value.data[attr_index] == value) { 
			ColorNodeForRule(node.Value, color, variation, halo);
		}
	}
}

function ColorNodeForRule(node : Node, color : Color, variation : float, halo : boolean){
	if (halo){
		node.setHaloColor(NudgeColor(color, variation));
	} else {
		node.SetColor(NudgeColor(color, variation), true);
	}
}

//Alters the color a small amount for variety.
function NudgeColor(c : Color){
	return NudgeColor(c, 0.3);
}

function NudgeColor(c : Color, dist : float){
	var red : float = c.r + Random.Range(-dist, dist);
	var green : float = c.g + Random.Range(-dist, dist);
	var blue : float = c.b + Random.Range(-dist, dist);
	return new Color(red, green, blue);	
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