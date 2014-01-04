#pragma strict

class BaseMenu extends MonoBehaviour {
	var displaying : boolean;

	var desired_x : float; //the left side of the menu while displaying
	var transition_x : float; //used for animation
	var x : float; //the current left side of the menu
	var width : float; 

	/* List of all classes attached to the NetworkController,
		used for easy referencing between menus*/
	protected var clusterController : ClusterController;
	protected var fileManager : FileManager;
	protected var fileMenu : FileMenu;
    protected var attributeMenu : AttributeMenu;
    protected var fkeyMenu : FkeyMenu;
    protected var colorController : ColorController;
    protected var searchController : SearchController;
    protected var selectionController : SelectionController;
    protected var colorRuleMenu : ColorRuleMenu;
    protected var colorRuleColorMenu : ColorRuleColorMenu;
    protected var colorPicker : ColorPicker;
    protected var searchMenu : SearchMenu;
    protected var displayMenu : DisplayMenu;
    protected var networkController : NetworkController;
    protected var centralityController : CentralityController;
    protected var graphController : GraphController;
    protected var axisController : AxisController;
    protected var graphMenu : GraphMenu;
    protected var mainMenu : MainMenu;
    protected var guiplus : GuiPlus;
    protected var timeFrameMenu : TimeFrameMenu;
    protected var timeSeriesController : TimeSeriesController;
    protected var popupWindow : PopupWindow;
    


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
		selectionController = GetComponent(SelectionController);
		colorRuleMenu = GetComponent(ColorRuleMenu);
		colorRuleColorMenu = GetComponent(ColorRuleColorMenu);
		colorPicker = GetComponent(ColorPicker);
		searchMenu = GetComponent(SearchMenu);
		displayMenu = GetComponent(DisplayMenu);
		networkController = GetComponent(NetworkController);
		centralityController = GetComponent(CentralityController);
		graphMenu = GetComponent(GraphMenu);
		graphController = GetComponent(GraphController);
		axisController = GetComponent(AxisController);
		mainMenu = GetComponent(MainMenu);
		guiplus = GetComponent(GuiPlus);
		timeFrameMenu = GetComponent(TimeFrameMenu);
		timeSeriesController = GetComponent(TimeSeriesController);
		popupWindow = GetComponent(PopupWindow);
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
		guiplus.Box(menuRect, title);

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

			//Enable the display of the parent menu, if necessary
			parent.EnableDisplay();

			//Close all sibiling menus
			for (var child in parent.children) {
				if (child != this) {
					child.DisableDisplay(true);
				}
			}
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