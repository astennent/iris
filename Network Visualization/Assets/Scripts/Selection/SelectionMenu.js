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
		var numNodes = selectionController.getNumSelected();
		if (numNodes > 0) {
			if (numNodes > 1) {
				title = numNodes + " nodes selected.";
			} else {
				var enumerator = selectionController.nodes.GetEnumerator();
				enumerator.MoveNext();
				title = enumerator.Current.getDisplayName() + "";
			}
			var menuRect = new Rect(x, 0, width, Screen.height);
			guiplus.Box(menuRect, title);
			
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

		var numNodes = selectionController.getNumSelected();

		//decide how big the box should be. 
		var data_rect_height : int;
		if (numNodes == 1) {
			data_rect_height = Screen.height-cur_y;
		} else {
			data_rect_height = 250;
		}

		//the width and height of the list of buttons
		var contentHeight = (selectionController.nodes.Count-1)*30 + data_rect_height;
		var contentWidth : int;
		if (contentHeight > Screen.height-cur_y) {
			contentWidth = width-16; //make space for the scrollbar
		} else {
			contentWidth = width;
		}

		nodeScrollPosition = GUI.BeginScrollView (Rect (x,cur_y,width,Screen.height-cur_y), 
				nodeScrollPosition, Rect (0, 0, contentWidth, contentHeight));

			var node_scroll_y = 0;

			for (var node : Node in selectionController.nodes) {
				GUI.color = node.color;

				if (selectionController.primaryNode == node) {
					DrawPrimaryNode(node_scroll_y, contentWidth, numNodes, data_rect_height);	    			
					node_scroll_y += data_rect_height;
				} else {
					var button_rect = new Rect(0, node_scroll_y, contentWidth, 30);
					if (GUI.Button(button_rect, node.getDisplayName())){
						selectionController.selectPrimaryNode(node);
					}
					node_scroll_y += 30;
				}

			}

			GUI.EndScrollView();

	}

	function DrawPrimaryNode(node_scroll_y : int, contentWidth : int, numNodes : int, data_rect_height : int) {
		var data_rect = new Rect(0, node_scroll_y, width, data_rect_height);
		var node = selectionController.primaryNode;

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
				dataScrollPosition, Rect (0, 0, contentWidth-16, data_height*(node.data.length)));
			
			var data_scroll_y = 0;
			var source_attrs = node.source.attributes;
			
			for (var index : int ; index < node.data.length ; index++) {

				var attr_name = source_attrs[index].getRestrictedName(width/2-10);	
				var attr_rect = new Rect(5, data_scroll_y, contentWidth/2, data_height);
				GUI.Label(attr_rect, attr_name);

				var attr_value_rect : Rect = attr_rect;
				attr_value_rect.x = contentWidth/2-10;
				attr_value_rect.width -=5;

				var attr_value = node.data[index]+"";
				GUI.TextField(attr_value_rect, attr_value);

				data_scroll_y += data_height;
			}

		GUI.EndScrollView();
	}
}