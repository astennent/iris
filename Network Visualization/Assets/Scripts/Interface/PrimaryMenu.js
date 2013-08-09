#pragma strict

class PrimaryMenu extends MonoBehaviour {
	var displaying : boolean;

	var desired_x_without_details : float;
	var desired_x_with_details : float;
	var x : float;
	var width : float;
	var display_disabling_suspended : boolean = false;

	/* List of all classes attached to the NetworkController,
		used for easy referencing between menus*/
	var clusterController : ClusterController;
	var fileManager : FileManager;
	var fileMenu : FileMenu;
    var attributeMenu : AttributeMenu;
    var fkeyMenu : FkeyMenu;
    var colorController : ColorController;
    var searchController : SearchController;
    var colorSchemeMenu : ColorSchemeMenu;
    var colorRuleMenu : ColorRuleMenu;
    var colorRuleColorMenu : ColorRuleColorMenu;
    var colorPicker : ColorPicker;
    var searchMenu : SearchMenu;
    var displayMenu : DisplayMenu;


    /* The text displayed at the top of the menu */
    var title : String = ""; //must be set separately in each menu.
	
    /* Any menus that will appear to the right of the current menu */
    var children : PrimaryMenu[];

	function Start(){
		desired_x_without_details = 45;
		desired_x_with_details = 160;
		width = 320;
		x =  -width;
		clusterController = GetComponent(ClusterController);
		fileManager = GetComponent(FileManager);
		fileMenu = GetComponent(FileMenu);
		attributeMenu = GetComponent(AttributeMenu);	
		fkeyMenu = GetComponent(FkeyMenu);
		colorController = GetComponent(ColorController);	
		searchController = GetComponent(SearchController);
		colorSchemeMenu = GetComponent(ColorSchemeMenu);
		colorRuleMenu = GetComponent(ColorRuleMenu);
		colorRuleColorMenu = GetComponent(ColorRuleColorMenu);
		colorPicker = GetComponent(ColorPicker);
		searchMenu = GetComponent(SearchMenu);
		displayMenu = GetComponent(DisplayMenu);
	}

	function Update () {	
		if (displaying){
			if (this.GetComponent(MainMenu).displaying_tooltips){
	   	 		var desired_x = desired_x_with_details;
	    	} else {
				desired_x = desired_x_without_details;
	    	}
		} else {
	    	desired_x = -width;
	    }	   
	    x = Mathf.Lerp(x, desired_x, .5);

	    if (displaying && !display_disabling_suspended && Input.GetButtonDown("Escape")) {
	    	DisableDisplay();
	    } 
	}

	function OnGUI(){
		var menuRect = new Rect(x, 0, width, Screen.height);
		GUI.Box(menuRect, title);

		var box = new Rect(x+width-30, 4, 26, 26);
		if (GUI.Button(box, "X")){
			DisableDisplay();
		};
	}

	//used by child menus to prevent closing on the first escape.
	function SuspendDisableDisplay(){
		display_disabling_suspended = true;
	}
	function ResumeDisableDisplay(){
		display_disabling_suspended = false;
	}

	function ToggleDisplay(){
		if (displaying){
			DisableDisplay();
		} else {
			EnableDisplay();
		}
	}

	function EnableDisplay(){
		displaying = true;
	}

	function DisableDisplay(){
		displaying = false;
	}
}