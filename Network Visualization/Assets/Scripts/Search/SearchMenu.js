#pragma downcast

class SearchMenu extends PrimaryMenu {

	private var searchString : String = "";
	private var oldSearchString : String = "";
	var match_index : int = 0;

	private var scrollPosition : Vector2 = Vector2.zero;
	private var lastScrollTime : float = 0;

	function OnGUI(){
		super.OnGUI();
		GUI.SetNextControlName("searchbar");

		var searchRect = new Rect(x+width*.05, 30, width*.9, 20);
		searchString = GUI.TextField(searchRect, searchString, 20);

		if (searchString != oldSearchString){
			oldSearchString = searchString;
			searchController.UpdateMatches(searchString);
		}
		var matches = searchController.matches;
		
		if (matches != null && matches.length > 0){
			title = matches.length + " matches.";
		} else {
			if (searchString.Length > 0){
				title = "No matches found.";
			} else {
				title = "Begin typing to search";
			}
		}
		var top_display = GUIContent(title);		
		scrollPosition = GUI.BeginScrollView (Rect (x+width*.05,60,width*.9,Screen.height-60),
	    scrollPosition, Rect (0, 0, 400, matches.length*30));
	    
	    var count = 0;
	    GUI.skin.button.alignment = TextAnchor.MiddleLeft;
	    for (var match : Node in matches){
	    	GUI.color = match.color;
	    	if (GUI.Button(Rect (10,count*30,width,30), match.name)){
	    		Camera.main.GetComponent(NetworkCamera).JumpTo(match.name);
	    	}
	    	if (count == match_index){
	    		GUI.Button (Rect (0,count*30,10,30), "");
	    	}
	    	count+=1;
	    }
	    GUI.skin.button.alignment = TextAnchor.MiddleCenter;
		
		GUI.EndScrollView();
			
		if (displaying){
								
			var e : Event = Event.current;

			if (Time.time-lastScrollTime > .15 && e.keyCode == KeyCode.DownArrow){
	       		if (match_index < matches.length-1){
	       			match_index+=1;
	       			lastScrollTime = Time.time;
	       		}
	       	} else if (Time.time-lastScrollTime > .15 && e.keyCode == KeyCode.UpArrow){
	       		if (match_index > 0){
	       			match_index-=1;
	       			lastScrollTime = Time.time;
	       		}
	       	} else if (e.keyCode == KeyCode.Return && matches.length > 0){
				Camera.main.GetComponent(NetworkCamera).JumpTo(matches[match_index].name);     		
	       	} else if (e.keyCode == KeyCode.Escape){
	       		DisableDisplay();
	       	}
	       	
	   	}
		
	}

	function DisableDisplay(){
		super.DisableDisplay();
		GUI.FocusControl("");
	}

	function EnableDisplay(){
		super.EnableDisplay();
		GUI.FocusControl("searchbar");	
	}
}