#pragma strict

class BaseMenu extends MonoBehaviour {
	var displaying : boolean;

	var desired_x : float; //the left side of the menu while displaying
	var transition_x : float; //used for animation
	var x : float; //the current left side of the menu
	var width : float; 

    /* The text displayed at the top of the menu */
    var title : String = ""; //must be set separately in each menu.
	
    /* Any menus that will appear to the right of the current menu */
    var children : List.<BaseMenu>;

    /* The single menu immediately to the left of the current menu */
    var parent : BaseMenu = null;

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
		var menuRect = new Rect(x, 0, width, MenuController.getScreenHeight());
		GuiPlus.Box(menuRect, title);

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

	//////////// Exposed static functions //////////////
	static function ToggleDisplay(menuClass : System.Type) {
		var menu = MenuController.getInstance(menuClass);
		menu.ToggleDisplay();
	}
	static function EnableDisplay(menuClass : System.Type) {
		var menu = MenuController.getInstance(menuClass);
		menu.EnableDisplay();
	}
	static function DisableDisplay(menuClass : System.Type) {
		var menu = MenuController.getInstance(menuClass);
		menu.DisableDisplay();
	}
	static function DisableDisplay(menuClass : System.Type, passItOn : boolean) {
		var menu = MenuController.getInstance(menuClass);
		menu.DisableDisplay(passItOn);
	}

	/////////// Hidden instance functions //////////////
	private function ToggleDisplay(){
		if (displaying) {
			DisableDisplay();
		} else {
			EnableDisplay();
		}
	}

	private function EnableDisplay(){
		Terminal.C("Enable Display", this);
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

	private function DisableDisplay() {
		DisableDisplay(false);
	}

	//if passItOn, only close the lowest-level children. (ex. User presses escape)
	//otherwise, close self and all children.
	private function DisableDisplay(passItOn : boolean) {
		Terminal.E("Disable Display", this);
		if (displaying) {
			var closedChild = false;
			for (var subMenu in children) {
				if (subMenu.displaying){
					DisableDisplay(typeof(subMenu), passItOn);
					closedChild = true;
				}
			}
			if ( (passItOn && !closedChild) || !passItOn) {
				displaying = false;
			}
			GUI.FocusControl("");
		}
		OnDisableDisplay();
	}

	function isDisplayingChild() {
		for (var subMenu in children) {
			if (subMenu.displaying){
				return true;
			}
		}
		return false;
	}

	//Overwritten by derived classes if they need to do something special
	static function OnDisableDisplay() {}

}