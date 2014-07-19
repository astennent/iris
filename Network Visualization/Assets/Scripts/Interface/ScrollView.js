#pragma strict

class ScrollView {

	// Holds a dictionary of all Scroll Panes that were initialized using the id method.
	private static var paneMap = new Dictionary.<String, ScrollPane>();
	private static var lowerRight = Vector2.zero;
	private static var paneStack = new LinkedList.<ScrollPane>();

	static function Begin(position : Rect, id : String) : Rect{
		var scrollPane = paneMap[id];
		if (scrollPane == null) {
			scrollPane = new ScrollPane(position);
			paneMap[id] = scrollPane;
		} 
		paneStack.AddLast(scrollPane);

		var scrollPaneRect = new Rect(scrollPane.scrollPosition.x, scrollPane.scrollPosition.y, scrollPane.innerSize.x, scrollPane.innerSize.y);
		return scrollPaneRect;
	}

	static function Begin(position : Rect, scrollPosition : Vector2, innerRect : Rect){
		var innerSize = new Vector2(innerRect.x, innerRect.y);
		var scrollPane = new ScrollPane(position, scrollPosition, innerSize);
		paneStack.AddLast(scrollPane);
		return scrollPane;
	}

	static function End() {
		var scrollPane = paneStack.Last.Value;
		if (scrollPane.isGenerated) {
			scrollPane.innerSize = lowerRight;
		}
	
		lowerRight = Vector2.zero;
		paneStack.RemoveLast();
	}

	static function AddRect(position : Rect) {
		lowerRight.x = Mathf.Max(position.x + position.width, lowerRight.x);
		lowerRight.y = Mathf.Max(position.y + position.height, lowerRight.y);
	}

	static function getPositionAdjustment() {
		var origin = Vector2.zero;
		for (var scrollPane in paneStack) {
			origin.x += scrollPane.position.x;
			origin.y += scrollPane.position.y;
		}
		return origin;
	}

	class ScrollPane  {
		var position : Rect;
		var scrollPosition : Vector2;
		var innerSize : Vector2;
		var isGenerated : boolean; //was this scroll pane created with the id method?

		// id method Constructor
		function ScrollPane(position : Rect) {
			this.position = position;
			this.scrollPosition = Vector2.zero;
			this.innerSize = Vector2.one; // Is this a good default?
			this.isGenerated = true;
		}

		// normal Constructor
		function ScrollPane(position : Rect, scrollPosition : Vector2, innerSize : Vector2) {
			this.position = position;
			this.scrollPosition = scrollPosition;
			this.innerSize = innerSize;
			this.isGenerated = false;
		}
	}
}