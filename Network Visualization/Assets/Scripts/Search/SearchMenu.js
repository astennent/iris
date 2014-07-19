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
		var top_display = GUIContent(title);
		var outerRect = new Rect (x+width*.05,60,width*.9,MenuController.getScreenHeight()-60);
		var innerSize = GuiPlus.BeginScrollView (outerRect, "SearchMenu");
	    
	    var count = 0;
	    for (var match : Node in matches) {
	    	GUI.color = match.getMenuColor();
	    	if (GuiPlus.Button(Rect (10,count*30,width,30), match.getDisplayName())){
	    		Camera.main.GetComponent(NetworkCamera).setTarget(match);
	    	}
	    	if (count == match_index){
	    		GuiPlus.Button (Rect (0,count*30,10,30), "");
	    	}
	    	count+=1;
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