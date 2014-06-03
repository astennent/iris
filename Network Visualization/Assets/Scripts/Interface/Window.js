#pragma strict
class Window extends MonoBehaviour {


	static var RESIZABLE = 1;
	static var DRAGGABLE = 2;
	/* static var SCROLLABLE = 4 */
	/* static var VISIBLE = 8 */

	private static var defaultParams = RESIZABLE + DRAGGABLE;

	var bounds : Rect;

	var params : int = defaultParams;
	var depth = 3;

	private var dragging = false;
	private var lastMousePosition = Vector2.zero;

	//TODO: Don't duplicate constructors.
	public static function Instantiate(bounds : Rect) {
		var instance = (new GameObject()).AddComponent(Window);
		instance.bounds = bounds;
		return instance;
	}

	function setPosition(position : Vector2) {
		bounds.x = position.x;
		bounds.y = position.y;
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

		GUI.BeginScrollView (bounds, Vector2.zero, innerRect);
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
					throw("I don't support that many arguments!");		
			}
		GUI.EndScrollView();

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

	private function RenderDraggableHeader() {
		var headerRect = bounds;
		var headerHeight = 20;
		headerRect.y -= headerHeight;
		headerRect.height = headerHeight;

		GuiPlus.Box(headerRect, "");

		var currentMousePosition = Input.mousePosition;
		currentMousePosition.y = Screen.height - currentMousePosition.y;

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