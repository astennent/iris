
//Future optimizations: 
	// args can probably be reused instead of replaced.
	// check position before adding function.

public class GuiPlus extends MonoBehaviour {

	private static var boxes = new List.<Rect>();
	static var seenDepths = new HashSet.<int>();

	private static var functionQueueSize = 0;
	private static var functionQueue = new List.<GUIFunction>();

	private static var scrollPaneStack = new LinkedList.<Vector2>();

	static var BEGIN_SCROLL_VIEW = 0;
	static var END_SCROLL_VIEW = 1;
	static var BUTTON = 2;
	static var BOX = 3;
	static var LABEL = 4;
	static var TOGGLE = 5;

	private static var leftButtonUp = false;
	private static var clickPosition = Vector2.zero;

	function LateUpdate(){
		boxes = new List.<Rect>(); //TODO: Move this to OnGUI?
		
		// Do not clear the functionQueue, keep the old objects around so we don't have to GC them.
		functionQueueSize = 0; 
		seenDepths.Clear();
	}

	function Update() {
		if (Input.GetMouseButtonDown(0)) {
			clickPosition = getMousePosition();
		}
		leftButtonUp = Input.GetMouseButtonUp(0);
	}

	////////////////// Extra GuiPlus functions /////////////////////////

	static function isBlocked() {
		var mousePosition = getMousePosition();
		for (var box in boxes) {
			if (box.Contains(mousePosition)){
				return true;
			}
		}
		return false;
	}

	//Returns the coordinates of the mouse position, optionally with respect to the scroll panes.
	static function getMousePosition() {
		return getMousePosition(false);
	}
	static function getMousePosition(ignoreScrollPanes : boolean) : Vector2 {
		var mousePosition = Input.mousePosition;
		mousePosition.y = Screen.height - mousePosition.y; 	

		if (!ignoreScrollPanes) {
			mousePosition -= ScrollView.getPositionAdjustment();
		}

		return mousePosition;
	}

	static function LockableToggle(position : Rect, on : boolean, text : String, locked : boolean) {
		var originalColor = GUI.color;
		if (locked) {
			GUI.color = ColorController.darkenColor(originalColor);
		}
		var result = GuiPlus.Toggle(position, on, text);
		GUI.color = originalColor;
		return (locked) ? on : result;
	}

	static function LockableButton(position : Rect, text : String, locked : boolean) {
		var originalColor = GUI.color;
		if (locked) {
			GUI.color = ColorController.darkenColor(originalColor);
		}
		var result = GuiPlus.Button(position, text);
		GUI.color = originalColor;
		return (locked) ? false : result;
	}


	///////////////// BEGIN GUIPLUS FUNCTION PASSTHROUGHS /////////////////


	// Draw a GuiBox which prevents the Selection
	// Controller from interacting with nodes
	static function Box(position : Rect, text : String) {
		Box(position, text, true);
	}
	static function Box(position : Rect, text:String, drawBox : boolean){
		boxes.Add(position);

		if (drawBox) {
			var guiFunction = AddGUIFunction(BOX, position, text);
		}
	}

	static function Button(position : Rect, param1) : boolean {
		var guiFunction = AddGUIFunction(BUTTON, position, param1);
		return guiFunction.CalculateDrawResult();
	}

	static function Button(position : Rect, param1, param2) : boolean {
		var guiFunction =  AddGUIFunction(BUTTON, position, param1, param2);
		return guiFunction.CalculateDrawResult();
	}


	static function Label(position : Rect, param1) {
		var guiFunction = AddGUIFunction(LABEL, position, param1);
	}

	static function Label(position : Rect, param1, param2) {
		var guiFunction = AddGUIFunction(LABEL, position, param1, param2);
	}

	static function Toggle(position : Rect, param1, param2) : boolean {
		var guiFunction = AddGUIFunction(TOGGLE, position, param1, param2);
		return guiFunction.CalculateDrawResult();
	}


	static function BeginScrollView(position : Rect, scrollPosition : Vector2, innerBox : Rect) : Vector2 {

		// Even with user-curated dropdowns, this is still necessary for the mouse position scrollpane stack.
		ScrollView.Begin(position, scrollPosition, innerBox);		
		
		var guiFunction = AddGUIFunction(BEGIN_SCROLL_VIEW, position, scrollPosition, innerBox);
		return guiFunction.CalculateDrawResult();
	}

	// TOOD: Better documentation: This returns the innerSize, not the scrollPosition.
	static function BeginScrollView(position : Rect, id : String) : Vector2 {
		var scrollPaneRect = ScrollView.Begin(position, id);
		var scrollPosition = new Vector2(scrollPaneRect.x, scrollPaneRect.y);
		var innerBox = new Rect(0, 0, scrollPaneRect.width, scrollPaneRect.height);

		var guiFunction = AddGUIFunction(BEGIN_SCROLL_VIEW, position, scrollPosition, innerBox);

		var newScrollPosition = guiFunction.CalculateDrawResult();
		ScrollView.SetScrollPosition(id, newScrollPosition);

		var innerSize = new Vector2(scrollPaneRect.width, scrollPaneRect.height);
		return innerSize;
	}


	static function EndScrollView() {
		ScrollView.End();

		var guiFunction = AddGUIFunction(END_SCROLL_VIEW);
		guiFunction.CalculateDrawResult();
	}


	/////////////// END GUIPLUS FUNCTION PASSTHROUGHS ////////////////


	function OnGUI() {
		var seenDepthKeys = getSortedKeys();
		for (var depth in seenDepthKeys) {
			for (var index = 0 ; index < functionQueueSize ; index++) {
				var guiFunction = functionQueue[index];
				if (guiFunction.isScrollPane || guiFunction.depth == depth) {
					guiFunction.Draw(); // Draw the buttons, but don't bother using the return values.
				}
			}
		}
	}

	private function getSortedKeys() {
		var keys = new List.<int>();
		for (var value in seenDepths) {
			keys.Add(value);
		}

		//Insertion Sort. 
		//TODO: Should be done in C# for Collections or implement a better sort.
		for (var i = 0 ; i < keys.Count ; i++) {
			var lowestIndex = i;
			var lowest = keys[i];
			for (var j = i ; j < keys.Count ; j++) {
				if (keys[j] < lowest) {
					lowestIndex = j;
					lowest = keys[j];
				}
			}
			var hold = keys[i];
			keys[i] = keys[lowestIndex];
			keys[lowestIndex] = hold;
		}

		return keys;
	}


	static function AddGUIFunction(func : int) {
		return ReplaceGUIFunction(func, new Array());
	}
	static function AddGUIFunction(func : int, arg0) {
		var args = new Array();
		args.push(arg0);
		return ReplaceGUIFunction(func, args);
	}
	static function AddGUIFunction(func : int, arg0, arg1) {
		var args = new Array();
		args.push(arg0);
		args.push(arg1);
		return ReplaceGUIFunction(func, args);
	}
	static function AddGUIFunction(func : int, arg0, arg1, arg2) {
		var args = new Array();
		args.push(arg0);
		args.push(arg1);
		args.push(arg2);
		return ReplaceGUIFunction(func, args);
	}
	static function ReplaceGUIFunction(func : int, args : Array) {
		if (functionQueue.Count == functionQueueSize) {
			var guiFunction = new GUIFunction(func, args);
			functionQueue.Add(guiFunction);

		} else {
			guiFunction = functionQueue[functionQueueSize];
			guiFunction.func = func;
			guiFunction.args = args;
		}
		guiFunction.isScrollPane = (func == BEGIN_SCROLL_VIEW || func == END_SCROLL_VIEW);
		guiFunction.init();
		functionQueueSize+=1;
		return guiFunction;
	}

	// Class to hold a function/parameter combination.
	class GUIFunction {
		var func : int;
		var args : Array;
		var color : Color;
		var skin : GUISkin;
		var depth : int;
		var isScrollPane : boolean = false; //must set to true manually on scroll-related functions.

		static var HIDDEN_COLOR = new Color(1, 1, 1, 0); 

		function GUIFunction(func : int, args : Array) {
			this.func = func;
			this.args = args;
		}
		
		function init() {
			color = GUI.color;
			depth = GUI.depth;
			skin = GUI.skin;
			GuiPlus.seenDepths.Add(depth);

			if (args.length > 0 && !isScrollPane) {
				ScrollView.AddElement(args[0]); //this should be position
			}
		}

		function CalculateDrawResult() {
			var preservedColor = GUI.color;
			var retVal : Object;
			switch (func) {
				case (BEGIN_SCROLL_VIEW):
					GUI.color = HIDDEN_COLOR;
					retVal = GUI.BeginScrollView(args[0], args[1], args[2]);
					break;
				case (END_SCROLL_VIEW):
					GUI.color = HIDDEN_COLOR;
					GUI.EndScrollView();
					break;
				case (BUTTON): 
					var mousePosition = GuiPlus.getMousePosition(); 
					var rect = args[0];
					if (GuiPlus.leftButtonUp && rect.Contains(mousePosition) &&
							rect.Contains(clickPosition-ScrollView.getPositionAdjustment())) {
						GuiPlus.leftButtonUp = false;
						retVal = true;
					} else {
						retVal = false;
					}
					break;
				case (TOGGLE):
					mousePosition = GuiPlus.getMousePosition();
					rect = args[0];
					var wasSelected = args[1];
					if (leftButtonUp && rect.Contains(mousePosition)  &&
						rect.Contains(clickPosition-ScrollView.getPositionAdjustment())) {
						GuiPlus.leftButtonUp = false;
						retVal = !wasSelected;
					} else {
						retVal = wasSelected;
					}
					break;
				default:
					throw "I don't know that function!";
			}
			GUI.color = preservedColor;
			return retVal;
		}

		function Draw() {

			var preservedColor = GUI.color;
			var preservedSkin = GUI.skin;

			GUI.color = this.color;
			GUI.skin = this.skin;

			switch (func) {
				case (BEGIN_SCROLL_VIEW):
					GUI.BeginScrollView(args[0], args[1], args[2]);
					break;
				case (END_SCROLL_VIEW):
					GUI.EndScrollView();
					break;
				case (BUTTON): 
					if (args.length == 2) {
						GUI.Button(args[0], args[1]);
					} else if (args.length == 3) {
						GUI.Button(args[0], args[1], args[2]);
					}
					break;
				case (BOX):
					GUI.Box(args[0], args[1]);
					break;
				case (LABEL):
					if (args.length == 2) {
						GUI.Label(args[0], args[1]);
					} else if (args.length == 3) {
						GUI.Label(args[0], args[1], args[2]);
					}
					break;
				case (TOGGLE):
					GUI.Toggle(args[0], args[1], args[2]);
					break;
				default:
					throw("I don't support that function! Time to add more.");
			} 

			GUI.color = preservedColor;
			GUI.skin = preservedSkin;
		}

	}
}


