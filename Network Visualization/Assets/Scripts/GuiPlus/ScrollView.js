#pragma strict

class ScrollView {

	// Holds a dictionary of all Scroll Panes that were initialized using the id method.
	private static var paneMap = new Dictionary.<String, ScrollPane>();
	private static var paneStack = new LinkedList.<ScrollPane>();

	static function Begin(position : Rect, id : String) : Rect{
		var scrollPane : ScrollPane;
		if (paneMap.ContainsKey(id)) {
			scrollPane = paneMap[id];
			scrollPane.position = position;
		} else {
			scrollPane = new ScrollPane(position);
			paneMap[id] = scrollPane;
		}
		paneStack.AddLast(scrollPane);
		var scrollPaneRect = new Rect(scrollPane.scrollPosition.x, scrollPane.scrollPosition.y, scrollPane.innerSize.x, scrollPane.innerSize.y);
		scrollPane.resetElements();
		return scrollPaneRect;
	}

	static function Begin(position : Rect, scrollPosition : Vector2, innerRect : Rect){
		var innerSize = new Vector2(innerRect.x, innerRect.y);
		var scrollPane = new ScrollPane(position, scrollPosition, innerSize);
		paneStack.AddLast(scrollPane);
		return scrollPane;
	}

	static function End() {
		paneStack.RemoveLast();
	}

	static function SetScrollPosition(id : String, scrollPosition : Vector2) {
		var scrollPane = paneMap[id];
		scrollPane.scrollPosition = scrollPosition;
	}

	static function AddElement(position : Rect) {
		if (paneStack.Count > 0) {
			var currentPane = paneStack.Last.Value;
				currentPane.addElement(position);
		}
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

		function addElement(position : Rect) {
			if (isGenerated) {
				innerSize.x = Mathf.Max(position.x + position.width, innerSize.x);
				innerSize.y = Mathf.Max(position.y + position.height, innerSize.y);
			}
		}

		//TODO: Figure out when to call this.
		function resetElements() {
			innerSize = Vector2.one;
		}
	}
}