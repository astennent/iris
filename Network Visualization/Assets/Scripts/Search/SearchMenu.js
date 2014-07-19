#pragma strict

class SearchMenu extends BaseMenu {

	private static var searchString : String = "";
	private static var oldSearchString : String = "";
	static var match_index : int = 0;

	private static var lastScrollTime : float = 0;

	function Start(){
		parent = GetComponent(MainMenu);
		super.Start();
	}

	function OnGUI(){
		super.OnGUI();

		if (!displaying) {
			return;
		}

		GUI.SetNextControlName("searchbar");

		var searchRect = new Rect(x+width*.05, 30, width*.9, 20);
		searchString = GUI.TextField(searchRect, searchString, 20);

		if (searchString != oldSearchString){
			oldSearchString = searchString;
			SearchController.UpdateMatches(searchString);
		}

		var matches = SearchController.matches;
		
		if (matches != null && matches.Count > 0){
			title = matches.Count + " matches.";
		} else {
			if (searchString.Length > 0){
				title = "No matches found.";
			} else {
				title = "Begin typing to search";
			}
		}

		var padding = 10;
		var resultHeight = 25;
		var cursorWidth = 10;
		
		var outerRect = new Rect (x+padding, 60, width-2*padding, MenuController.getScreenHeight()-60);
		var innerSize = GuiPlus.BeginScrollView (outerRect, "SearchMenu");
		
		var contentWidth = (innerSize.y <= outerRect.height) ? outerRect.width : outerRect.width-19;
		var resultWidth = contentWidth - cursorWidth;

		for (var i = 0 ; i < matches.Count ; i++) {
			var match = matches[i];
			GUI.color = match.getMenuColor();
			// draw the cursor that indicates scroll position.
			if (i == match_index){
				GuiPlus.Button (Rect (0,i*resultHeight,cursorWidth,resultHeight), "");
			}
			// draw the button itself.
			if (GuiPlus.Button(Rect (cursorWidth,i*resultHeight, resultWidth, resultHeight), match.getDisplayName())){
				Camera.main.GetComponent(NetworkCamera).setTarget(match);
			}
	    }
		
		GuiPlus.EndScrollView();
			
		if (displaying){
								
			var e : Event = Event.current;

			if (Time.time-lastScrollTime > .15 && e.keyCode == KeyCode.DownArrow){
	       		if (match_index < matches.Count-1){
	       			match_index+=1;
	       			lastScrollTime = Time.time;
	       		}
	       	} else if (Time.time-lastScrollTime > .15 && e.keyCode == KeyCode.UpArrow){
	       		if (match_index > 0){
	       			match_index-=1;
	       			lastScrollTime = Time.time;
	       		}
	       	} else if (e.keyCode == KeyCode.Return && matches.Count > 0){
				Camera.main.GetComponent(NetworkCamera).setTarget(matches[match_index]);     		
	       	} else if (e.keyCode == KeyCode.Escape){
	       		DisableDisplay(SearchMenu);
	       	}
	       	
	   	}
		
	}

	static function EnableDisplay(){
		super.EnableDisplay(SearchMenu);
		GUI.FocusControl("searchbar");	
	}
}