#pragma strict
class Window extends MonoBehaviour {


	static var RESIZABLE = 1;
	static var DRAGGABLE = 2;
	/* static var SCROLLABLE = 4 */
	/* static var VISIBLE = 8 */

	private static var defaultParams = RESIZABLE + DRAGGABLE;

	var bounds : Rect;

	var title : String = "";
	var params : int = defaultParams;
	var depth = 3;

	private var dragging = false;
	private var lastMousePosition = Vector2.zero;


	public static function Instantiate(bounds : Rect) {
		var instance = (new GameObject()).AddComponent(Window);
		instance.bounds = bounds;
		return instance;
	}

	// Manually sets the position of the window
	function setPosition(position : Vector2) {
		bounds.x = position.x;
		bounds.y = position.y;
	}

	// Returns the upper left corner
	function getPosition() {
		return new Vector2(bounds.x, bounds.y);
	}

	/* 
		Draws the provided GUI function, but with parameters passed in as an array
		Usage:
		GuiPlus.Button(myRectangle, "test") becomes
		myWindow.Render(GuiPlus.Button, [ myRectangle, "test" ])

		Returns the value returned by drawFunc
	*/
	function Render(drawFunc) { //Render with no parameters.
		return Render(drawFunc, []);
	} 
	function Render(drawFunc : Function, params : Array) {		
		var result = null;

		var previousDepth = GUI.depth;
		GUI.depth = this.depth;

		//Handle the header and drag effects
		RenderDraggableHeader();

		//if not scrollable
		var innerRect = bounds;
		innerRect.x = 0;
		innerRect.y = 0;

		GuiPlus.Box(bounds, "");

		GuiPlus.BeginScrollView (bounds, Vector2.zero, innerRect);
			switch(params.length) {
				case 0:
					result = render0(drawFunc);
					break;
				case 1: 
					result = render1(drawFunc, params[0]);
					break;
				case 2:
					result = render2(drawFunc, params[0], params[1]);
					break;
				default:
					throw("I don't support that many arguments! If you want to add that function, just edit this class.");		
			}
		GuiPlus.EndScrollView();

		GUI.depth = previousDepth;

		return result;
	}

	private function render0(drawFunc : Function) {
		return drawFunc();
	}

	private function render1(drawFunc : Function, param1) {
		return drawFunc(param1);
	}

	private function render2(drawFunc : Function, param1, param2) {
		return drawFunc(param1, param2);
	}

	//Responsible for Drawing the header bar that can be clicked to drag the window around
	private function RenderDraggableHeader() {
		var headerRect = bounds;
		var headerHeight = 20;
		headerRect.y -= headerHeight;
		headerRect.height = headerHeight;

		GuiPlus.Button(headerRect, title);

		var currentMousePosition = GuiPlus.getMousePosition();

		if (!dragging && Input.GetMouseButtonDown(0) && headerRect.Contains(currentMousePosition)) {
			startDragging();
		} else if (dragging && (Input.GetMouseButtonUp(0) || !Input.GetMouseButton(0))) {
			stopDragging();			
		}

		if (dragging) {
			currentMousePosition.y = Screen.height - currentMousePosition.y;
			var deltaPosition = currentMousePosition - lastMousePosition;
			bounds.x += deltaPosition.x;
			bounds.y -= deltaPosition.y;
			lastMousePosition = currentMousePosition;
		}
	}

	private function startDragging() {
		lastMousePosition = Input.mousePosition;
		dragging = true;
	}

	private function stopDragging() {
		dragging = false;
	}



}