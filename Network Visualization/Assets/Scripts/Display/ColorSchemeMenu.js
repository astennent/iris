class ColorSchemeMenu extends SecondaryMenu {
	private var scrollPosition : Vector2 = Vector2.zero;
	
	function Start(){
		super.Start();
		width = 180;
		parentMenu = GetComponent(DisplayMenu);
		title = "Color Schemes";
	}

	function OnGUI(){
		super.OnGUI();
		GUI.color = Color.white;

		var schemes = colorController.getSchemes();
		var current_scheme = colorController.getSchemeName();

		scrollPosition = GUI.BeginScrollView (Rect (x,50,width,Screen.height-33), 
			scrollPosition, Rect (0, 0, width, 30*schemes.length+20));

		var y = 0;
		
		for (var i=0 ; i<schemes.length ; i++){
			var scheme : String = schemes[i];
			var schemeRect = new Rect(0, y, width, 30);

			//if this is -1, color the global scheme, else you're dealing with a rule.
			var rule_index = colorRuleMenu.rule_index;
			if (rule_index > -1){
				var current_rule = colorController.rules[rule_index];
			}

			if (rule_index == -1 && current_scheme == scheme) { 
				GUI.color = colorController.button_color; 
			} else if (rule_index != -1 && i == current_rule.color_scheme) {
				GUI.color = current_rule.color;
			} else {
				GUI.color = Color.white; 
			}

			if (GUI.Button(schemeRect, scheme)){
				if (rule_index == -1) {
					colorController.setScheme(i);
				} else {
					current_rule.setScheme(i);
				}
			}
			y+=30;
		}

		GUI.EndScrollView();
	}

	function DisableDisplay(){
		super.DisableDisplay();
		if (colorRuleMenu.displaying){
			colorRuleMenu.DisableDisplay();
		}
	}

}