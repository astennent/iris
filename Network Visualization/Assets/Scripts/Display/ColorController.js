#pragma strict

private static var schemes = ["Bright", "Pastel", "Grayscale", "Rust", "Sunlight", "Forest Glade", 
					"Aqua"];

static var rules : List.<ColorRule> = new List.<ColorRule>();

static function getSchemeNames() {
	return schemes;
}

//Called by Display Menu or Axis Controller.
function Start(){
	var fallbackRule = createRule();
	fallbackRule.setColoringMethod(ColorRule.COLORING_SCHEME);
	fallbackRule.setFilterMethod(ColorRule.FILTER_NODE);
	fallbackRule.setChangingSize(true);
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

static function ApplyRulesForDateChange() {
	var foundUpdatableRule = false;
	for (var rule in rules){
		if (foundUpdatableRule || //You've already found a rule and must reapply everything after it
				rule.getFilterMethod() == 1 || //Coloring by cluster 
				rule.getColoringMethod() == 2 || rule.getColoringMethod() == 3 //Coloring by centrality or continuous attribute
			) {
			rule.Apply();
		}
	}
}

static function ApplyAllRules(){
	ApplyAllRules(true, true);
}

static function ApplyAllRules(change_color : boolean, change_size : boolean) {
	//reset all halos.
	for (var file : DataFile in FileManager.files){
		for (var node in file.getNodes()){
			node.resetColorRules();
		}
	}

	for (var rule in rules){
		rule.Apply(change_color, change_size);
	}
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

static function darkenColor(input : Color) {
	return new Color(input.r/2, input.g/2, input.b/2);
}

static function lightenColor(input : Color) {
	return new Color( (input.r+1)/2, (input.g+1)/2, (input.b+1)/2);
}

// TODO This should be in a color controller
static function mergeColors(colors : List.<Color>) : Color{

	if (colors.Count == 0) {
		return Color.white;
	}

	var r = 0.0;
	var g = 0.0;
	var b = 0.0;

	for (var color in colors) {
		r += color.r;
		g += color.g;
		b += color.b;
	}

	var numColors = colors.Count;
	r /= numColors; 
	g /= numColors;
	b /= numColors;

	return new Color(r, g, b);
}

static function handleDateChange() {
	for (var rule in rules) {
		
		if (rule.getColoringMethod() == ColorRule.COLORING_CENTRALITY) { //centrality
			rule.Apply(true, true);
		} else { //Don't recolor if it's not centrality.
			rule.Apply(false, true);
		}
	}
}

static function handleAttributeInvalidate(invalid_attr : Attribute) {
	for (var rule in rules) {
		var isFilteringByAttribute = (rule.getFilterMethod() == ColorRule.FILTER_ATTRIBUTE && invalid_attr == rule.getAttribute());
		var isSizingByAttribute = (rule.getSizingType() == ColorRule.SIZING_ATTRIBUTE && invalid_attr == rule.getContinuousAttribute() && rule.isChangingSize());
		var isColoringbyAttribute = (rule.getColoringMethod() == ColorRule.COLORING_CONTINUOUS_ATTR && invalid_attr == rule.getContinuousAttribute());
		if ( isFilteringByAttribute || isSizingByAttribute || isColoringbyAttribute) {
			var change_color = (isFilteringByAttribute || isColoringbyAttribute);
			var change_size = (isFilteringByAttribute || isSizingByAttribute);
			rule.Apply(change_color, change_size);
		}
	}
}