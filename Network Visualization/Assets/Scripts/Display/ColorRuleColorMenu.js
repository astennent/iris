#pragma strict

class ColorRuleColorMenu extends BaseMenu {
	private var schemeScrollPosition : Vector2 = Vector2.zero;
	private var rule : ColorRule;
	function Start(){
		parent = GetComponent(DisplayMenu);
		super.Start();
		width = 200;
		title = "Rule Options";
	}

	function OnGUI(){
		super.OnGUI();
		var button_text : String;
		var label_text : String;

		var rule_index = displayMenu.rule_index;
		if (rule_index >= 0) {
			if (!displaying){
				EnableDisplay();
			}
		} else {
			if (displaying) {
				DisableDisplay();
			} 
			return;
		}

		rule = colorController.rules[displayMenu.rule_index];

		if (displaying){
			var y = DrawMethod(35);
			var method = rule.getMethod();
			if (method == 0) {
				y = DrawColorCustom(y);
			} else if (method == 1) {
				y = DrawColorScheme(y);
			} else {
				y = DrawCentrality(y);
			}

			DrawSizingOptions(y);				
		}
	}

	function DrawMethod(cur_y : int) {
		GUI.Box(Rect(x+5, cur_y, width-10, 80), "");
		var toggle_rect = new Rect(x+20, cur_y+10, width, 20);
		var method = rule.getMethod();
		if (GUI.Toggle(toggle_rect, method==0, "Custom Color") && method != 0){
			rule.setMethod(0);
		}
		toggle_rect.y+=20;
		if (GUI.Toggle(toggle_rect, method==1, "Scheme") && method != 1){
			rule.setMethod(1);
		}
		toggle_rect.y+=20;
		if (GUI.Toggle(toggle_rect, method==2, "Centrality") && method != 2){
			rule.setMethod(2);
		} 

		return cur_y+80;
	}

	function DrawColorCustom(cur_y : int) {
		var original_halo = rule.halo;
		if (rule.halo){
			var halo_txt = "Coloring Selection Halo";
		} else {
			halo_txt = "Coloring Node Body";
		}
		rule.halo = GUI.Toggle (Rect (x+10, cur_y, width-20, 20), rule.halo, halo_txt);

		cur_y += 20;		
		colorPicker.Init(x, cur_y, false);
		var original_color = rule.color;
		rule.color = colorPicker.getColor();

		cur_y += 190;
		var original_variation = rule.variation;
		GUI.Label(new Rect(x+10, cur_y, width, 20), "Randomness: " + rule.variation.ToString("f2"));
		rule.variation = GUI.HorizontalSlider(Rect(x+130, cur_y+5, width-140, 20), rule.variation, 0.0, 1.0);

		if (rule.color != original_color || rule.variation != original_variation || rule.halo != original_halo){
			colorController.ApplyRule(rule);
		}
		cur_y += 30;
		return cur_y;
	}

	function DrawColorScheme(y : int) {
		GUI.color = Color.white;

		var schemeNames = colorController.getSchemeNames();

		schemeScrollPosition = GUI.BeginScrollView (Rect (x,y,width,Screen.height-33), 
			schemeScrollPosition, Rect (0, 0, width, 30*schemeNames.length+20));

		var cur_y = 0;

		for (var i=0 ; i<schemeNames.length ; i++){
			var schemeName : String = schemeNames[i];
			var schemeRect = new Rect(0, cur_y, width, 30);

			if (rule.getScheme() == i) { 
				GUI.color = rule.scheme_button_color; 
			} else {
				GUI.color = Color.white; 
			}

			if (GUI.Button(schemeRect, schemeName)){
				rule.setScheme(i);
			}
			cur_y+=30;
		}

		GUI.EndScrollView();
		y+=cur_y;
		return y;
	}

	function DrawCentrality(cur_y : int) {
		var centrality_types = colorController.centrality_types;
		for (var index : int = 0 ; index < centrality_types.length ; index++){

			if (rule.getCentralityType() == index) {
				GUI.color = rule.getColor();
			} else {
				GUI.color = Color.white;
			}

			if (GUI.Button(new Rect(x, cur_y, width, 30), centrality_types[index]) &&
					rule.getCentralityType() != index){
				rule.setCentralityType(index);
			}
			cur_y += 30;
		}
		GUI.color = Color.white;
		return cur_y;
	}

	function DrawSizingOptions(cur_y : int){
		var size_text : String;
		if (rule.uses_manual_size) {
			size_text = "Setting node size manually.";
		} else {
			size_text = "Not changing node size.";
		}

		var original_uses_size : boolean = rule.uses_manual_size;
		var original_manual_size : float = rule.manual_size;

		rule.uses_manual_size = GUI.Toggle(Rect (x+10, cur_y, width-20, 20), rule.uses_manual_size, size_text);
		cur_y+=20;
		if (rule.uses_manual_size) {
			GUI.Label(new Rect(x+10, cur_y, width, 20), "Size: " + rule.manual_size.ToString("f2"));
			rule.manual_size = GUI.HorizontalSlider(Rect(x+80, cur_y+5, width-100, 20), rule.manual_size, 1.0, 50.0);
		}

		if (rule.uses_manual_size != original_uses_size || rule.manual_size != original_manual_size){
			colorController.ApplyRule(rule, false, true);
		}
	}

	function DisableDisplay(){
		displayMenu.setRuleIndex(-1);
		super.DisableDisplay();
	}
}