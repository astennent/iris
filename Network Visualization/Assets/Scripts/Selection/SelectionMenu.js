#pragma strict

class SelectionMenu extends BaseMenu {
	private var dataScrollPosition : Vector2 = Vector2.zero;
	private var nodeScrollPosition : Vector2 = Vector2.zero;
	var more : Texture;

	function Start() {
		super.Start();
		displaying = true;
		width = 230;
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
		var numNodes = SelectionController.getNumSelected();
		if (numNodes > 0) {
			if (numNodes > 1) {
				title = numNodes + " nodes selected.";
			} else {
				var enumerator = SelectionController.nodes.GetEnumerator();
				enumerator.MoveNext();
				title = enumerator.Current.getDisplayName() + "";
			}
			var menuRect = new Rect(x, 0, width, MenuController.getScreenHeight());
			GuiPlus.Box(menuRect, title);
			
			//"More" button
			//var button_position : Rect = new Rect(Screen.width, 5, 35, 35);
			var button_position : Rect = new Rect(x-15, 0, 15, MenuController.getScreenHeight());
			if (GUI.Button(button_position, more)){
				ToggleDisplay(SelectionMenu);
			}	

			var cur_y = 30;
			DrawNodeList(cur_y);

		}
	}

	function DrawNodeList(cur_y : int) {

		var numNodes = SelectionController.getNumSelected();

		//decide how big the box should be. 
		var data_rect_height : int;
		if (numNodes == 1) {
			data_rect_height = MenuController.getScreenHeight()-cur_y;
		} else {
			data_rect_height = 250;
		}

		//the width and height of the list of buttons
		var contentHeight = (SelectionController.nodes.Count-1)*30 + data_rect_height;
		var contentWidth : int;
		if (contentHeight > MenuController.getScreenHeight()-cur_y) {
			contentWidth = width-16; //make space for the scrollbar
		} else {
			contentWidth = width;
		}

		nodeScrollPosition = GUI.BeginScrollView (Rect (x,cur_y,width,MenuController.getScreenHeight()-cur_y), 
				nodeScrollPosition, Rect (0, 0, contentWidth, contentHeight));

			var node_scroll_y = 0;

			for (var node : Node in SelectionController.nodes) {
				GUI.color = node.getMenuColor();

				if (SelectionController.primaryNode == node) {
					DrawPrimaryNode(node_scroll_y, contentWidth, numNodes, data_rect_height);	    			
					node_scroll_y += data_rect_height;
				} else {
					var button_rect = new Rect(0, node_scroll_y, contentWidth, 30);
					if (GUI.Button(button_rect, node.getDisplayName())){
						SelectionController.selectPrimaryNode(node);
					}
					node_scroll_y += 30;
				}

			}

			GUI.EndScrollView();

	}

	function DrawPrimaryNode(node_scroll_y : int, contentWidth : int, numNodes : int, data_rect_height : int) {
		var data_rect = new Rect(0, node_scroll_y, width, data_rect_height);
		var node = SelectionController.primaryNode;

		var extra_vertical_space : int;
		if (numNodes > 1) {
			GUI.Box(data_rect, node.getDisplayName());
			extra_vertical_space = 30; 
		} else {
			GUI.Box(data_rect, ""); //Don't display the title again.
			extra_vertical_space = 0;
		}

		GUI.color = Color.white;

		var data_height = 20;

		dataScrollPosition = GUI.BeginScrollView (Rect (0,node_scroll_y+extra_vertical_space,contentWidth,data_rect_height-extra_vertical_space), 
				dataScrollPosition, Rect (0, 0, contentWidth-16, data_height*(node.Count())));
			
			var data_scroll_y = 0;
			var source_attrs = node.source.attributes;
			
			for (var index : int ; index < source_attrs.Count ; index++) {
				var attribute = source_attrs[index];

				var attr_numeric_value = node.GetNumeric(index);
				var attr_max = attribute.getMaxValue();

				GUI.color = ColorController.GenFractionalColor(attr_numeric_value, attr_max);
				GUI.Box(new Rect(5, data_scroll_y, contentWidth, data_height), "");
				//GUI.color = Color.white;

				var attr_name = attribute.getRestrictedName(width/2-10);	
				var attr_rect = new Rect(5, data_scroll_y, contentWidth/2, data_height);
				GUI.Label(attr_rect, attr_name);

				var attr_value_rect : Rect = attr_rect;
				attr_value_rect.x = contentWidth/2-10;
				attr_value_rect.width -= 5;

				var attr_value = node.Get(index)+"";
				var new_value = GUI.TextField(attr_value_rect, attr_value);

				//Update the data point.
				if (attr_value != new_value) {
					node.Set(attribute, new_value);
				}

				data_scroll_y += data_height;
			}

		GUI.EndScrollView();
	}
}