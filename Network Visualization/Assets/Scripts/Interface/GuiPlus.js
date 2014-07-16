public class GuiPlus extends MonoBehaviour {

	private static var boxes = new List.<Rect>();
	private static var functionQueue = new List.<GUIFunction>();
	static var seenDepths = new HashSet.<int>();

	static var BEGIN_SCROLL_VIEW = 0;
	static var END_SCROLL_VIEW = 1;
	static var BUTTON = 2;
	static var BOX = 3;
	static var LABEL = 4;
	static var TOGGLE = 5;

	static function isBlocked() {
		for (var box in boxes) {
			var mousePosition = Input.mousePosition;
			mousePosition.y = Screen.height - mousePosition.y; //Stupid unity.
			if (box.Contains(mousePosition)){
				return true;
			}
		}
		return false;
	}

	function LateUpdate(){
		boxes = new List.<Rect>(); //TODO: Move this to OnGUI?
		functionQueue.Clear();
		seenDepths.Clear();
	}

	///////////////// BEGIN GUIPLUS FUNCTION PASSTHROUGHS /////////////////


	// Draw a GuiBox which prevents the Selection
	// Controller from interacting with nodes
	static function Box(r : Rect, text : String) {
		Box(r, text, true);
	}
	static function Box(r : Rect, text:String, drawBox : boolean){
		boxes.Add(r);

		if (drawBox) {
			var guiFunction = new GUIFunction(BOX, r, text);
			functionQueue.Add(guiFunction);
		}
	}

	static function Button(param0, param1) : boolean {
		var guiFunction =  new GUIFunction(BUTTON, param0, param1);
		functionQueue.Add(guiFunction);
		return guiFunction.execute(true);
	}

	static function BeginScrollView(outerBox : Rect, scrollPosition : Vector2, innerBox : Rect) : Vector2 {
		var guiFunction = new GUIFunction(BEGIN_SCROLL_VIEW, outerBox, scrollPosition, innerBox);
		guiFunction.isScrollPane = true;
		functionQueue.Add(guiFunction);
		return guiFunction.execute(true);
	}

	static function EndScrollView() {
		var guiFunction = new GUIFunction(END_SCROLL_VIEW);
		guiFunction.isScrollPane = true;
		functionQueue.Add(guiFunction);
		guiFunction.execute(true);
	}

	static function Label(param0, param1) {
		var guiFunction =  new GUIFunction(LABEL, param0, param1);
		functionQueue.Add(guiFunction);
		guiFunction.execute(true);
	}

	static function Label(param0, param1, param2) {
		var guiFunction =  new GUIFunction(LABEL, param0, param1, param2);
		functionQueue.Add(guiFunction);
		guiFunction.execute(true);
	}

	static function Toggle(param0, param1, param2) : boolean {
		var guiFunction =  new GUIFunction(TOGGLE, param0, param1, param2);
		functionQueue.Add(guiFunction);
		return guiFunction.execute(true);
	}

	/////////////// END GUIPLUS FUNCTION PASSTHROUGHS ////////////////

	static function LockableToggle(r : Rect, on : boolean, text : String, locked : boolean) {
		var originalColor = GUI.color;
		if (locked) {
			GUI.color = ColorController.darkenColor(originalColor);
		}
		var result = GuiPlus.Toggle(r, on, text);
		GUI.color = originalColor;
		return (locked) ? on : result;
	}


	function OnGUI() {
		flush();	
	}

	//Flush all saved gui objects, in order.
	private function flush() {
		var seenDepthKeys = getSortedKeys();
		for (var depth in seenDepthKeys) {
			for (var guiFunction in functionQueue) {
				if (guiFunction.isScrollPane || guiFunction.depth == depth) {
					guiFunction.execute(false); // Draw the buttons, but don't bother using the return values.
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

	// Class to hold a function/parameter combination.
	class GUIFunction {
		var func : int;
		var args : Array = new Array();
		var color : Color;
		var skin : GUISkin;
		var depth : int;
		var isScrollPane : boolean = false; //must set to true manually on scroll-related functions.

		static var HIDDEN_COLOR = new Color(1, 1, 1, 0); 

		function GUIFunction(func : int) {
			this.func = func;
			init();
		}
		function GUIFunction(func : int, arg0) {
			this.func = func;
			args = new Array();
			args.Push(arg0);
			init();
		}
		function GUIFunction(func : int, arg0, arg1) {
			this.func = func;
			args = new Array();
			args.Push(arg0);
			args.Push(arg1);
			init();
		}
		function GUIFunction(func : int, arg0, arg1, arg2) {
			this.func = func;
			args = new Array();
			args.Push(arg0);
			args.Push(arg1);
			args.Push(arg2);
			init();
		}

		private function init() {
			color = GUI.color;
			depth = GUI.depth;
			skin = GUI.skin;
			GuiPlus.seenDepths.Add(depth);
		}

		function execute(hidden : boolean) {
			var preservedColor = GUI.color;
			var preservedSkin = GUI.skin;

			GUI.color = (hidden) ? HIDDEN_COLOR : this.color;
			GUI.skin = this.skin;

			var retVal = this.Draw();
			
			GUI.color = preservedColor;
			GUI.skin = preservedSkin;

			return retVal;
		}

		private function Draw() {
			if (args.length == 0) {
				if (func == END_SCROLL_VIEW) {
					GUI.EndScrollView();
					return;
				}
				throw("I don't know that function! Add me: " + func);
			} else if (args.length == 1) {
				throw("I don't know that function! Add me: " + func);
			} else if (args.length == 2) {
				if (func == BUTTON) {
					return GUI.Button(args[0], args[1]);
				} else if (func == BOX) {
					return GUI.Box(args[0], args[1]);
				} else if (func == LABEL) {
					GUI.Label(args[0], args[1]);
					return;
				}
				throw("I don't know that function! Add me: " + func);
			} else if (args.length == 3) {
				if (func == BEGIN_SCROLL_VIEW) {
					return GUI.BeginScrollView(args[0], args[1], args[2]);
				} else if (func == TOGGLE) {
					return GUI.Toggle(args[0], args[1], args[2]);
				} else if (func == LABEL) {
					GUI.Label(args[0], args[1], args[2]);
					return;
				}
				throw("I don't know that function! Add me: " + func);
			} else {
				throw("I don't support that many arguments! Time to add more.");
			}
			return null;
		}

	}
}


