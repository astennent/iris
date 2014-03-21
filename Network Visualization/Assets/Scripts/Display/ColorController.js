#pragma strict

private static var schemes = ["Bright", "Pastel", "Grayscale", "Rust", "Sunlight", "Forest Glade", 
					"Aqua"];

static var rules : List.<ColorRule> = new List.<ColorRule>();

//Determines which nodes to apply a rule to.
static var rule_types = ["Source", "Cluster", "Node", "Attribute"];; 

static function getSchemeNames() {
	return schemes;
}

//Called by Display Menu or Axis Controller.
static function Init(){
	createRule();
	rules[0].is_fallback = true;
	rules[0].setMethod(1);
}

static function createRule() : ColorRule {
	var new_rule : ColorRule = new ColorRule();
	rules.Add(new_rule);
	return new_rule;
}

static function removeRule(i : int){
	rules.RemoveAt(i);
}

static function moveRuleUp(i : int){
	if (i > 1){
		var temp = rules[i];
		rules[i] = rules[i-1];
		rules[i-1] = temp;
	}
}
static function moveRuleDown(i : int){
	if (i < rules.Count -1) {
		var temp = rules[i];
		rules[i] = rules[i+1];
		rules[i+1] = temp;
	}
}


static function ApplyAllRules(){
	//reset all halos.
	for (var file : DataFile in FileManager.files){
		for (var node in file.getNodes()){
			node.resetColorRules();
		}
	}

	for (var x = 0; x < rules.Count ; x++){
		ApplyRule(rules[x]);
	}
}


static function ApplyRule(rule: ColorRule) {
	//Note that change_color and change_size are for small changes in the menu.
	ApplyRule(rule, true, true);
}


static function ApplyRule(rule : ColorRule, change_color : boolean, change_size : boolean) {
	if (rule.is_fallback) {
		ApplyFallbackRule(rule, change_color, change_size);
		return;
	}

	var rule_type = rule.getRuleType();
	if (rule_type == 0) {  //source
		for (var source : DataFile in rule.getSources()) {
			ColorBySource(source, rule, change_color, change_size);
		}
	} else if (rule_type == 1) { //cluster
		var clusterList = rule.getClusters();
		for (var cluster_id in clusterList) {
			ColorByCluster(cluster_id, rule, change_color, change_size);
		}
	} else if (rule_type == 2) { //node			
		var nodeList = rule.getNodes();
		for (node in nodeList) {
			var color = rule.getColor();
			ColorNodeForRule(node, rule, color, change_color, change_size);
		}			
	} else if (rule_type == 3){ //attr
		if (rule.getAttribute() != null) {
			ColorByAttribute(rule.getAttribute(), rule.getAttributeValue(), rule, change_color, change_size);
		}
	}
}

private static function ApplyFallbackRule(rule : ColorRule, change_color : boolean, change_size : boolean) {
	var rule_type = rule.getRuleType();
	if (rule_type == 0) {
			for (var source : DataFile in FileManager.files) {
				ColorBySource(source, rule, change_color, change_size);
			}
	} else if (rule_type == 1) {
			for (var entry in ClusterController.group_dict){ //loop over the cluster ids
				ColorByCluster(entry.Key, rule, change_color, change_size);
			}
	} else if (rule_type == 2) {
		for (var file in FileManager.files){
			var nodes = file.getNodes();
			for (var node in nodes){
				var color : Color = rule.getColor();
				ColorNodeForRule(node, rule, color, change_color, change_size);
			}
		}
	} // Note that rule_type should not be 3 with a fallback rule.
}

static function ColorByCluster(cluster_id : int, rule  : ColorRule, change_color : boolean , change_size : boolean){
	var color : Color = rule.getColor();
	var nodes = ClusterController.group_dict[cluster_id];	
	for (var node in nodes){
		ColorNodeForRule(node, rule, color, change_color, change_size);
	}
}

static function ColorBySource(file : DataFile, rule  : ColorRule, change_color : boolean , change_size : boolean){
	var color : Color = rule.getColor();
	for (var node in file.getNodes()){
		ColorNodeForRule(node, rule, color, change_color, change_size);
	}
}
//color nodes based on a certain attribute value.
static function ColorByAttribute(attribute : Attribute, value : String, rule  : ColorRule, change_color : boolean , change_size : boolean){
	var color : Color = rule.getColor();
	var file : DataFile = attribute.file;
	var attr_index : int = file.attributes.IndexOf(attribute);

	for (var node in file.getNodes()){
		if (node.Get(attr_index) == value) { 
			ColorNodeForRule(node, rule, color, change_color, change_size);
		}
	}
}

static function ColorNodeForRule(node : Node, rule : ColorRule, color : Color, change_color : boolean , change_size : boolean) : void {
	var coloring_halo = rule.coloring_halo;
	var coloring_node = rule.coloring_node;

	var variation : float = getAdjustedVariation(rule);

	//Override color in the case of coloring by centrality or continuous variable.
	var adjusted_variation = variation;
	if (rule.getMethod() == 2) {
		color = GenCentralityColor(rule, node);
		adjusted_variation = 0;
	} else if (rule.getMethod() == 3) {
		var continuousAttribute = rule.getContinuousAttribute();
		if (continuousAttribute != null) {
			color = continuousAttribute.genFractionalColor(node);
		} else {
			color = Color.white;
		}
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

static function getAdjustedVariation(rule : ColorRule){
	if (rule.getMethod() == 2 || rule.getMethod() == 1  && rule.getScheme() == 2){
		return 0;
	}
	return rule.variation;
}

//Alters the color a small amount for variety.
static function NudgeColor(c : Color){
	return NudgeColor(c, 0.3);
}

static function NudgeColor(c : Color, dist : float){
	c.r += Random.Range(-dist, dist);
	c.g += Random.Range(-dist, dist);
	c.b += Random.Range(-dist, dist);
	return c;	
}

static function GenRandomColor(scheme_index : int) {
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
		return NudgeColor(new Color(.25, .75, .1, .75), .2);
	} else if (scheme_index == 6){ //aqua
		return NudgeColor(new Color(.1, .4, .75, .75));
	} else {
		return Color.white;
	}
}

static function GenCentralityColor(rule : ColorRule, node : Node) {
	var centrality_type = rule.getCentralityType();

	//scale centrality from red to cyan.	
	var fraction : float = CentralityController.getCentralityFraction(node, rule);

	if (!fraction) {
		return Color.black;
	}

	var inverted = rule.getInvertCentrality();
	if (centrality_type == 1 && !rule.getInterCluster()) {	//For consistency, auto-invert closeness so red is central.
		inverted = !inverted;
	}

	if (inverted) {
		fraction = 1-fraction;
	}
	
	return GenFractionalColor(fraction, 1.0);
}

static function GenFractionalColor(numerator : float, denominator : float) {
	if (denominator == 0) {
		return Color.white;
	} else {
		return GenFractionalColor(numerator / denominator);
	}
}

// Expects a number between 0 and 1
static function GenFractionalColor(fraction : float) {
	var adjusted_frac : float;
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


static function GenGrayscale(){
	var scale_number = Random.Range(0.0,1.0);
	return new Color(scale_number, scale_number, scale_number, .75);
}

static function GenScaledColor(pastel: boolean){
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

static function randBinary(){ //true or false
	if (Random.Range(0,2) == 0){
		return true;
	} 
	return false;
}

static function handleDateChange() {
	for (var rule in rules) {
		
		if (rule.getMethod() == 2) { //centrality
			ApplyRule(rule, true, true);
		} else { //Don't recolor if it's not centrality.
			ApplyRule(rule, false, true);
		}
	}
}