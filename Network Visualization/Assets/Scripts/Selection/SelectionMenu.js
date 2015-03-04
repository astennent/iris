#pragma strict

class SelectionMenu extends BaseMenu {
	private var dataScrollPosition : Vector2 = Vector2.zero;
	private var nodeScrollPosition : Vector2 = Vector2.zero;
	private static var handlePosition : Rect;
	var more : Texture;

	function Start() {
		super.Start();
		displaying = true;
		width = 300;
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
		GUI.skin = MenuController.getSkin();
		var numNodes = SelectionController.getNumSelected();
		desired_x = Screen.width-width;
		if (numNodes > 0) {
			if (numNodes > 1) {
				title = numNodes + " nodes selected.";
			} else {
				var enumerator = SelectionController.nodes.GetEnumerator();
				enumerator.MoveNext();
				title = enumerator.Current.getDisplayName() + "";
			}
			var menuRect = new Rect(x, MenuController.getScreenTop(), width, MenuController.getScreenHeight());
			GuiPlus.Box(menuRect, title);
			
			//"More" button
			//var button_position : Rect = new Rect(Screen.width, 5, 35, 35);
			handlePosition = new Rect(x-15, MenuController.getScreenTop(), 15, MenuController.getScreenHeight());
			GuiPlus.Box(handlePosition, ""); //capture mouse clicks so menu isn't closed.
			if (GuiPlus.Button(handlePosition, more)){
				ToggleDisplay(SelectionMenu);
			}	

			var cur_y = 30.0;
			cur_y = DrawNodeList(cur_y);
			DrawPrimaryNode(cur_y+5);
		}
	}

	function DrawNodeList(cur_y : int) : float {

		var numNodes = SelectionController.getNumSelected();
		var nodeButtonHeight = 30;

		//decide how big the box should be. 
		var outBoxHeight : int;
		if (numNodes == 1 || SelectionController.getPrimaryNode() == null) {
			return cur_y; 
		} else {
			var max_height = (MenuController.getScreenHeight()-cur_y)/2;
			var ideal_height = numNodes * nodeButtonHeight;
			outBoxHeight =  Mathf.Min(max_height, ideal_height);
		}

		var contentHeight = (SelectionController.nodes.Count)*30;
		var contentWidth : float;
		if (contentHeight > outBoxHeight) {
			contentWidth = width-16; //make space for the scrollbar
		} else {
			contentWidth = width;
		}

		nodeScrollPosition = GuiPlus.BeginScrollView (Rect (x, cur_y, width, outBoxHeight), 
				nodeScrollPosition, Rect (0, 0, contentWidth, contentHeight));

			var node_scroll_y = 0;

			var removedNode : Node = null; 
			for (var node : Node in SelectionController.nodes) {
				GUI.color = node.getMenuColor();

				//draw the main button
				var button_rect = new Rect(0, node_scroll_y, contentWidth-nodeButtonHeight, nodeButtonHeight);
				if (GuiPlus.Button(button_rect, node.getDisplayName())){
					SelectionController.selectPrimaryNode(node);
				}

				if (SelectionController.getPrimaryNode() != node) {
					GUI.color = Color.white;
				}

				//Draw the remove button
				var remove_button_rect = new Rect(contentWidth-nodeButtonHeight, node_scroll_y, nodeButtonHeight, nodeButtonHeight);
				if (GuiPlus.Button(remove_button_rect, "")) {
					removedNode = node; //queue removal, since you can't unselect while iterating
				}

				node_scroll_y += nodeButtonHeight;
			}

			if (removedNode != null) {
				SelectionController.deselectNode(removedNode);
			}

			GuiPlus.EndScrollView();
		return cur_y + outBoxHeight;

	}

	function DrawPrimaryNode(cur_y : int) {
		var numNodes = SelectionController.getNumSelected();
		var node = SelectionController.getPrimaryNode();
		
		GUI.color = Color.white;
		var outerRect = new Rect(x, cur_y, width, MenuController.getScreenHeight()-cur_y);

		var extra_vertical_space : int;
		if (numNodes > 1) {
			GuiPlus.Box(outerRect, node.getDisplayName());
			extra_vertical_space = 30; 
		} else {
			GuiPlus.Box(outerRect, ""); //Don't display the title again.
			extra_vertical_space = 0;
		}

		//Compensate for title.
		outerRect.y+=extra_vertical_space;
		outerRect.height-=extra_vertical_space;

		var source_attrs = node.getSource().getAttributes();
		var data_height = 25;
		var innerHeight = source_attrs.Count * data_height;

		var contentWidth : float;
		if (innerHeight > outerRect.height) {
			contentWidth = width; //make space for the scrollbar
		} else {
			contentWidth = width+16;
		}

		var innerRect = new Rect(0, 0, contentWidth-16, innerHeight);

		dataScrollPosition = GuiPlus.BeginScrollView (outerRect, 
				dataScrollPosition, innerRect);
			
			var data_scroll_y = 0;
			
			for (var index : int ; index < source_attrs.Count ; index++) {
				var attribute = source_attrs[index];

				GUI.color = attribute.genFractionalColor(node); 
				GuiPlus.Box(new Rect(0, data_scroll_y, contentWidth/2-5, data_height), "");

				var attr_name = attribute.getRestrictedName(width/2-10);	
				var attr_rect = new Rect(5, data_scroll_y, contentWidth/2, data_height);
				GuiPlus.Label(attr_rect, attr_name);

				var attr_value_rect : Rect = attr_rect;
				attr_value_rect.x = contentWidth/2-10;
				attr_value_rect.width -= 5;

				var attr_value = node.Get(index)+"";
				GUI.color = Color.white;
				var new_value = GUI.TextField(attr_value_rect, attr_value);

				//Update the data point.
				if (attr_value != new_value) {
					node.Set(attribute, new_value);
				}

				data_scroll_y += data_height;
			}

		GuiPlus.EndScrollView();
	}

	// Used by menu controller to find the right side of the screen.
	static function getLeftSide() {
		if (SelectionController.getNumSelected() > 0 && handlePosition != null) {
			return handlePosition.x;
		} else {
			return Screen.width;
		}
	}
}