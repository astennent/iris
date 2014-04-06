#pragma strict

class PlanarityMenu extends BaseMenu {

	function Start(){
		parent = GetComponent(MainMenu);
		super.Start();
		title = "Planarity";
		width = 250;
	}

	function OnGUI() {
		super.OnGUI();
		var cur_y = DrawFlattenButton(40);
	}

	private function DrawFlattenButton(cur_y : int) {
		if (PlanarityController.isFlat()){
			GUI.color = new Color(1, .3, .3);
			var button_text = "Unflatten Graph";
		} else {
			GUI.color = new Color(.4, 1, .4);
			button_text = "Flatten Graph";
		}
		if (GUI.Button(new Rect(x+10, cur_y, width-20, 30), button_text)) {
			PlanarityController.toggleFlat();
		}

		GUI.color = Color.white;
		return cur_y+30;
	}
}