#pragma strict

class BaseMenu extends MonoBehaviour {
	var displaying : boolean;

	var desired_x : float; //the left side of the menu while displaying
	var transition_x : float; //used for animation
	var x : float; //the current left side of the menu
	var width : float; 

	/* List of all classes attached to the NetworkController,
		used for easy referencing between menus*/
	var clusterController : ClusterController;
	var fileManager : FileManager;
	var fileMenu : FileMenu;
    var attributeMenu : AttributeMenu;
    var fkeyMenu : FkeyMenu;
    var colorController : ColorController;
    var searchController : SearchController;
    var colorRuleMenu : ColorRuleMenu;
    var colorRuleColorMenu : ColorRuleColorMenu;
    var colorPicker : ColorPicker;
    var searchMenu : SearchMenu;
    var displayMenu : DisplayMenu;
    var networkController : NetworkController;
    var mainMenu : MainMenu;


    /* The text displayed at the top of the menu */
    var title : String = ""; //must be set separately in each menu.
	
    /* Any menus that will appear to the right of the current menu */
    var children : List.<BaseMenu>;

    /* The single menu immediately to the left of the current menu */
    var parent : BaseMenu;

	function Start(){
		if (parent != null) {
			parent.Start();
			desired_x = parent.desired_x + parent.width;
			parent.AddChild(this);
		} else {
			desired_x = 0;
		}
		width = 320; //default width for left-most menus. All others should specify width manually.
		x =  -width;
		clusterController = GetComponent(ClusterController);
		fileManager = GetComponent(FileManager);
		fileMenu = GetComponent(FileMenu);
		attributeMenu = GetComponent(AttributeMenu);	
		fkeyMenu = GetComponent(FkeyMenu);
		colorController = GetComponent(ColorController);	
		searchController = GetComponent(SearchController);
		colorRuleMenu = GetComponent(ColorRuleMenu);
		colorRuleColorMenu = GetComponent(ColorRuleColorMenu);
		colorPicker = GetComponent(ColorPicker);
		searchMenu = GetComponent(SearchMenu);
		displayMenu = GetComponent(DisplayMenu);
		networkController = GetComponent(NetworkController);
		mainMenu = GetComponent(MainMenu);
	}

	function Update () {	
		if (displaying) {
			transition_x = desired_x;
		} else {
	    	transition_x = -width;
	    }	   
	    x = Mathf.Lerp(x, transition_x, .5);
	}

	function OnGUI() {
		var menuRect = new Rect(x, 0, width, Screen.height);
		GUI.Box(menuRect, title);

		var box = new Rect(x+width-30, 4, 26, 26);
		if (GUI.Button(box, "X")){
			DisableDisplay();
		};
	}

	function AddChild(child : BaseMenu) {
		children.Add(child);
	}

	function ShiftX(diff : float){
		desired_x += diff;
	}

	function ToggleDisplay() {
		ToggleDisplay(false);
	}

	function ToggleDisplay(passItOn : boolean){
		if (displaying) {
			DisableDisplay(passItOn);
		} else {
			EnableDisplay();
		}
	}

	function EnableDisplay(){
		if (parent != null) {
			parent.EnableDisplay();
		}
		displaying = true;
	}

	function DisableDisplay(){
		DisableDisplay(false);
	}

	//if passItOn, only close the lowest-level children. (ex. User presses escape)
	//otherwise, close self and all children.
	function DisableDisplay(passItOn : boolean) {
		if (displaying) {
			var closedChild = false;
			for (var subMenu in children) {
				if (subMenu.displaying){
					subMenu.DisableDisplay(passItOn);
					closedChild = true;
				}
			}
			if (passItOn && !closedChild || !passItOn) {
				displaying = false;
			}
			GUI.FocusControl("");
		}
	}

}