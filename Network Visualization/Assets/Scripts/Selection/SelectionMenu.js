#pragma strict

class SelectionMenu extends BaseMenu {
	private var dataScrollPosition : Vector2 = Vector2.zero;
	var more : Texture;

	function Start() {
		super.Start();
		displaying = true;
		width = 200;
		desired_x = Screen.width-width;
	}

	function Update () {
		if (displaying) {
			transition_x = desired_x;
		} else {
	    	transition_x = Screen.width;
	    }	   
	    x = Mathf.Lerp(x, transition_x, .5);
	}

	function OnGUI(){
		var numNodes = selectionController.getNumSelected();
		if (numNodes > 0) {
			if (numNodes > 1) {
				title = numNodes + " nodes selected.";
			} else {
				var enumerator = selectionController.nodes.GetEnumerator();
				enumerator.MoveNext();
				title = enumerator.Current.getName() + "";
			}
			var menuRect = new Rect(x, 0, width, Screen.height);
			GUI.Box(menuRect, title);
			
			//"More" button
			//var button_position : Rect = new Rect(Screen.width, 5, 35, 35);
			var button_position : Rect = new Rect(x-15, 0, 15, Screen.height);
			if (GUI.Button(button_position, more)){
				ToggleDisplay();
			}	

			var cur_y = 30;
			DrawNodeList(cur_y);

		}
	}

	function DrawNodeList(cur_y : int) {
		for (var node : Node in selectionController.nodes) {
			GUI.color = node.color;
			if (selectionController.primaryNode == node) {
    			var data_rect = new Rect(x, cur_y, width, 200);
				GUI.Box(data_rect, node.getName());
				GUI.color = Color.white;

				var data_height = 20;

				dataScrollPosition = GUI.BeginScrollView (Rect (x,cur_y+20,width,200-20), 
						dataScrollPosition, Rect (0, 0, width, data_height*(node.data.length+1)));
					
					var scroll_y = 0;
					var node_data = node.data;
					var source_attrs = node.source.attributes;
					
					for (var index : int ; index < node.data.length ; index++) {


						var attr_name = source_attrs[index].column_name+": ";
						var attr_value = node_data[index] + "";
	    				

	    				var attr_rect = new Rect(0, scroll_y, width/2, data_height);
						var centeredStyle = GUI.skin.GetStyle("Label");

	    				centeredStyle.alignment = TextAnchor.MiddleRight;
	    				GUI.Label(attr_rect, attr_name);
	    				
	    				attr_rect.x = width/2;
	    				centeredStyle.alignment = TextAnchor.MiddleLeft;
	    				GUI.Label(attr_rect, attr_value);

	    				scroll_y += data_height;
					}

				GUI.EndScrollView();
				cur_y += 200;
			} else {
				var button_rect = new Rect(x, cur_y, width, 30);
				if (GUI.Button(button_rect, node.getName())){
					selectionController.selectPrimaryNode(node);
				}
				cur_y += 30;
			}

		}

	}
}