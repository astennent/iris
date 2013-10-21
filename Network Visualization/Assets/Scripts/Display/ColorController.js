#pragma strict

private var networkController : NetworkController;
private var clusterController : ClusterController;
private var fileManager : FileManager;
private var centralityController : CentralityController;

var button_color : Color;
private var schemes = ["Bright", "Pastel", "Grayscale", "Rust", "Sunlight", "Forest Glade", 
					"Aqua"];

var rules : List.<ColorRule> = new List.<ColorRule>();

var rule_types : String[]; //Determines which nodes to apply a rule to.
var centrality_types : String[];

var colorRulePrefab : ColorRule;

function getSchemeNames() {
	return schemes;
}

function Start(){
	networkController = this.GetComponent(NetworkController);
	clusterController = this.GetComponent(ClusterController);
	fileManager = this.GetComponent(FileManager);
	centralityController = this.GetComponent(CentralityController);

	createRule();
	rules[0].is_fallback = true;
	rules[0].setMethod(1);
	rule_types = ["Source", "Cluster", "Node", "Attribute"]; 
	centrality_types = ["Degree", "Closeness", "Betweenness (NA)", "Eigenvector (NA)"];
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
			node.resetColorRules();
		}
	}

	for (var x = 0; x < rules.Count ; x++){
		ApplyRule(rules[x]);
	}
}


function ApplyRule(rule: ColorRule) {
	print(centralityController.getMaxCentrality(0, 1));

	//Note that change_color and change_size are for 
	ApplyRule(rule, true, true);
}


function ApplyRule(rule : ColorRule, change_color : boolean, change_size : boolean) {
	var rule_type = rule.getRuleType();
	if (rule_type == 0) {  //source

		//the fallback rule transparently applies itself to all files.
		if (rule.is_fallback) {
			for (var source : DataFile in fileManager.files) {
				ColorBySource(source, rule, change_color, change_size);
			}
		} else { //seperate loops because dataManager stores DataFiles in a List, rather than a HashSet.
			for (var source : DataFile in rule.getSources()) {
				ColorBySource(source, rule, change_color, change_size);
			}
		}


	} else if (rule_type == 1) { //cluster

		//the fallback rule transparently applies itself to all groups.
		if (rule.is_fallback) {
			for (var entry in clusterController.group_dict){ //loop over the cluster ids
				//color = rule.getColor();
				ColorByCluster(entry.Key, rule, change_color, change_size);
			}
		} else {
			if (rule.getClusterId() != -1) {
				ColorByCluster(rule.getClusterId(), rule, change_color, change_size);
			}
		}

	} else if (rule_type == 2) { //node

		//the fallback rule transparently applies itself to all groups.
		if (rule.is_fallback) {
			for (var file in fileManager.files){
				var nodes = file.nodes;
				for (var entry in nodes){
					var node : Node = entry.Value;
					var color : Color = rule.getColor();
					ColorNodeForRule(node, rule, color, change_color, change_size);
				}
			}
		}

		//TODO non-fallback

	} else if (rule_type == 3){ //attr
		if (rule.getAttribute() != null) {
			ColorByAttribute(rule.getAttribute(), rule.getAttributeValue(), rule, change_color, change_size);
		}
	}
}

function ColorByCluster(cluster_id : int, rule  : ColorRule, change_color : boolean , change_size : boolean){
	var color : Color = rule.getColor();
	var nodes = clusterController.group_dict[cluster_id];	
	for (var node in nodes){
		ColorNodeForRule(node, rule, color, change_color, change_size);
	}
}

function ColorBySource(file : DataFile, rule  : ColorRule, change_color : boolean , change_size : boolean){
	var color : Color = rule.getColor();
	for (var node in file.nodes){
		ColorNodeForRule(node.Value, rule, color, change_color, change_size);
	}
}
//color nodes based on a certain attribute value.
function ColorByAttribute(attribute : Attribute, value : String, rule  : ColorRule, change_color : boolean , change_size : boolean){
	var color : Color = rule.getColor();
	var file : DataFile = attribute.file;
	var attr_index : int = file.attributes.IndexOf(attribute);

	for (var node in file.nodes){
		if (""+node.Value.data[attr_index] == value) { 
			ColorNodeForRule(node.Value, rule, color, change_color, change_size);
		}
	}
}

function ColorNodeForRule(node : Node, rule : ColorRule, color : Color, change_color : boolean , change_size : boolean){
	var coloring_halo = rule.coloring_halo;
	var coloring_node = rule.coloring_node;

	var variation : float = getAdjustedVariation(rule);

	//Override color in the case of coloring by centrality.
	var adjusted_variation = variation;
	if (rule.getMethod() == 2) {
		color = GenCentralityColor(rule, node);
		adjusted_variation = 0;
	}
	
	if (change_color) {
		if (coloring_halo){
			node.setHaloColor(NudgeColor(color, adjusted_variation));
		} 
		if (coloring_node) {
			node.setColor(NudgeColor(color, adjusted_variation), true);
		}
	}
	if (change_size && rule.uses_manual_size) {
		node.setManualSize(rule.manual_size);
		node.setSizingType(1); //manual size
	}
}

function getAdjustedVariation(rule : ColorRule){
	if (rule.getMethod() == 2 || rule.getMethod() == 1  && rule.getScheme() == 2){
		return 0;
	}
	return rule.variation;
}

//Alters the color a small amount for variety.
function NudgeColor(c : Color){
	return NudgeColor(c, 0.3);
}

function NudgeColor(c : Color, dist : float){
	c.r += Random.Range(-dist, dist);
	c.g += Random.Range(-dist, dist);
	c.b += Random.Range(-dist, dist);
	return c;	
}

function GenRandomColor(scheme_index : int){
	if (scheme_index == 0){ //bright
		return GenScaledColor(false);
	} else if (scheme_index == 1){ //pastel
		return GenScaledColor(true);
	} else if (scheme_index == 2) { //grayscale
		return GenGrayscale();
	} else if (scheme_index == 3) { //rust
		return NudgeColor(new Color(.72, .26, .05, .75));
	} else if (scheme_index == 4) { //sunlight
		return NudgeColor(new Color(1, .7, 0, .75));
	} else if (scheme_index == 5) { //forest glade
		return NudgeColor(new Color(.25, .75, .1, .75));
	} else if (scheme_index == 6){ //aqua
		return NudgeColor(new Color(.1, .4, .75, .75));
	} else {
		return Color.white;
	}
}

function GenCentralityColor(rule : ColorRule, node : Node) {
	var centrality_type = rule.getCentralityType();

	centralityController.Init(centrality_type); //this is a no-op if it's already been initialized.

	var node_centrality = node.getCentrality(centrality_type);
	var max_centrality = centralityController.getMaxCentrality(centrality_type, node.group_id);
	var min_centrality = centralityController.getMinCentrality(centrality_type, node.group_id);

	//scale centrality from red to cyan.
	var fraction : float = (node_centrality-min_centrality+.1)/(max_centrality-min_centrality-.001);
	var adjusted_frac : float;

	if (!fraction) {
		return Color.black;
	}

	if (fraction > 2.0/3) { //red down to yellow
		adjusted_frac = (fraction - 2.0/3)*3;
		return new Color(1, 1-adjusted_frac, 0, .75);
	} else if (fraction > 1.0/3) { //yellow down to green
		adjusted_frac = (fraction - 1.0/3)*3;
		return new Color(adjusted_frac, 1, 0, .75);
	} else { //green to blue
		adjusted_frac = fraction*3;
		return new Color(0, 1, 1-adjusted_frac, .75);
	}
}


function GenGrayscale(){
	var scale_number = Random.Range(0.0,1.0);
	return new Color(scale_number, scale_number, scale_number, .75);
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
	return new Color(r, g, b, .5);
}

function randBinary(){ //true or false
	if (Random.Range(0,2) == 0){
		return true;
	} 
	return false;
}