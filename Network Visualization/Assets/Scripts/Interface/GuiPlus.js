public class GuiPlus extends MonoBehaviour {

	private static var boxes = new List.<Rect>();
	private static var functionQueue = new List.<GUIFunction>();
	static var seenDepths = new HashSet.<int>();

	private static var scrollPaneStack = new LinkedList.<Vector2>();

	static var BEGIN_SCROLL_VIEW = 0;
	static var END_SCROLL_VIEW = 1;
	static var BUTTON = 2;
	static var BOX = 3;
	static var LABEL = 4;
	static var TOGGLE = 5;

	function LateUpdate(){
		boxes = new List.<Rect>(); //TODO: Move this to OnGUI?
		functionQueue.Clear();
		seenDepths.Clear();
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
			var guiFunction = new GUIFunction(BOX, position, text);
			guiFunction.init();
			functionQueue.Add(guiFunction);
		}
	}

	static function Button(position : Rect, param1) : boolean {
		var guiFunction =  new GUIFunction(BUTTON, position, param1);
		guiFunction.init();
		functionQueue.Add(guiFunction);
		return guiFunction.execute(true);
	}

	static function Button(position : Rect, param1, param2) : boolean {
		var guiFunction =  new GUIFunction(BUTTON, position, param1, param2);
		guiFunction.init();
		functionQueue.Add(guiFunction);
		return guiFunction.execute(true);
	}


	static function Label(position : Rect, param1) {
		var guiFunction =  new GUIFunction(LABEL, position, param1);
		guiFunction.init();
		functionQueue.Add(guiFunction);
		guiFunction.execute(true);
	}

	static function Label(position : Rect, param1, param2) {
		var guiFunction =  new GUIFunction(LABEL, position, param1, param2);
		guiFunction.init();
		functionQueue.Add(guiFunction);
		guiFunction.execute(true);
	}

	static function Toggle(position : Rect, param1, param2) : boolean {
		var guiFunction =  new GUIFunction(TOGGLE, position, param1, param2);
		guiFunction.init();
		functionQueue.Add(guiFunction);
		return guiFunction.execute(true);
	}


	static function BeginScrollView(position : Rect, scrollPosition : Vector2, innerBox : Rect) : Vector2 {

		// Even with user-curated dropdowns, this is still necessary for the mouse position scrollpane stack.
		ScrollView.Begin(position, scrollPosition, innerBox);		
		
		var guiFunction = new GUIFunction(BEGIN_SCROLL_VIEW, position, scrollPosition, innerBox);
		guiFunction.init();
		guiFunction.isScrollPane = true;
		functionQueue.Add(guiFunction);

		return guiFunction.execute(true);
	}

	// TOOD: Better documentation: This returns the innerSize, not the scrollPosition.
	static function BeginScrollView(position : Rect, id : String) : Vector2 {
		var scrollPaneRect = ScrollView.Begin(position, id);
		var scrollPosition = new Vector2(scrollPaneRect.x, scrollPaneRect.y);
		var innerBox = new Rect(0, 0, scrollPaneRect.width, scrollPaneRect.height);

		var guiFunction = new GUIFunction(BEGIN_SCROLL_VIEW, position, scrollPosition, innerBox);
		guiFunction.isScrollPane = true;
		guiFunction.init();
		functionQueue.Add(guiFunction);

		var newScrollPosition = guiFunction.execute(true);
		ScrollView.SetScrollPosition(id, newScrollPosition);

		var innerSize = new Vector2(scrollPaneRect.width, scrollPaneRect.height);
		return innerSize;
	}


	static function EndScrollView() {
		ScrollView.End();

		var guiFunction = new GUIFunction(END_SCROLL_VIEW);
		guiFunction.isScrollPane = true;
		guiFunction.init();
		functionQueue.Add(guiFunction);

		guiFunction.execute(true);
	}


	/////////////// END GUIPLUS FUNCTION PASSTHROUGHS ////////////////



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
		}
		function GUIFunction(func : int, position : Rect) {
			this.func = func;
			args = new Array();
			args.Push(position);
		}
		function GUIFunction(func : int, position : Rect, arg1) {
			this.func = func;
			args = new Array();
			args.Push(position);
			args.Push(arg1);
		}
		function GUIFunction(func : int, position : Rect, arg1, arg2) {
			this.func = func;
			args = new Array();
			args.Push(position);
			args.Push(arg1);
			args.Push(arg2);
		}

		function init() {
			color = GUI.color;
			depth = GUI.depth;
			skin = GUI.skin;
			GuiPlus.seenDepths.Add(depth);

			if (args.length > 0 && !isScrollPane) {
				ScrollView.AddElement(args[0]);
			}

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
			var result : Object;
			switch (func) {
				case (BEGIN_SCROLL_VIEW):
					result = GUI.BeginScrollView(args[0], args[1], args[2]);
					break;
				case (END_SCROLL_VIEW):
					GUI.EndScrollView();
					break;
				case (BUTTON): 
					if (args.length == 2) {
						result = GUI.Button(args[0], args[1]);
					} else if (args.length == 3) {
						result = GUI.Button(args[0], args[1], args[2]);
					}
					break;
				case (BOX):
					result = GUI.Box(args[0], args[1]);
					break;
				case (LABEL):
					if (args.length == 2) {
						GUI.Label(args[0], args[1]);
					} else if (args.length == 3) {
						GUI.Label(args[0], args[1], args[2]);
					}
					break;
				case (TOGGLE):
					result = GUI.Toggle(args[0], args[1], args[2]);
					break;
				default:
					throw("I don't support that function! Time to add more.");
			} 
			return result;
		}

	}
}


