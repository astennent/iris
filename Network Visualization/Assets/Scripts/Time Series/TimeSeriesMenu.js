#pragma strict

public class TimeSeriesMenu extends BaseMenu {

	static var height = 65;	
	private static var sliding : boolean = false;

	var play : Texture;
	var pause : Texture;
	var next : Texture;
	var prev : Texture;

	function Start() {
		super.Start();
		desired_x = 45;
		width = Screen.width - 45;
		x = -width;
	}

	function OnGUI() {

		//Modified from BaseMenu to stay at bottom, next to MainMenu.
		var y = Screen.height - height;
		var menuRect = new Rect(x, y, width, height);
		GuiPlus.Box(menuRect, "");

		if (!displaying) {
			return;
		}

		//Draw the enable button
		var enabled = TimeSeriesController.getEnabled();
		var enableRect = new Rect(x+10, y+10, width*.1-20, height-20);
		var enableText : String;
		if (enabled) {
			enableText = "Disable\nTime Series";
		} else {
			GUI.color = Attribute.TIME_SERIES_COLOR;
			enableText = "Enable\nTime Series";
		}

		if (GUI.Button(enableRect, enableText)){
			TimeSeriesController.toggleEnabled();
		}
		GUI.color = Color.white;


		//Draw the timeline
		DrawTimeline(y);

		//Draw Play/Pause/Skip
		DrawButtons(y);
		
	}

	function DrawTimeline(y : int) {

		//Center alignment
		var centeredStyle : GUIStyle;
		centeredStyle = GUI.skin.GetStyle("Label");
		var oldAlignment = centeredStyle.alignment;
		centeredStyle.alignment = TextAnchor.MiddleCenter;
		
		var lineX = x + width * .1;
		var lineWidth = width * .75;
		var timeLineBox = new Rect(lineX, y+10, lineWidth, height-20);

		GUI.color = new Color(1, 1, 1, .5);
		GUI.Box(timeLineBox, "");
		GUI.color = Color.white;

		var dates = TimeSeriesController.getDates(lineWidth);
		
		//Stop if there are less than two dates.
		if (dates.Count == 0) {
			GUI.Label(timeLineBox, "No valid dates found.", centeredStyle);
			return;
		} else if (dates.Count == 1) {
			GUI.Label(timeLineBox, ""+dates[0], centeredStyle);
			return;
		}

		//Draw Dates
		var mouseCoords = Input.mousePosition;
		var locked = false;
		mouseCoords.y = Screen.height - mouseCoords.y;
		GUI.color = new Color(1, 1, 1, .2);
		for (var dateRatio in dates) {
			var ratio : float = dateRatio.ratio;
			var date_x = lineX + ratio*lineWidth;
			var rect = new Rect(date_x-5, timeLineBox.y, 10, timeLineBox.height);
			if (GUI.Button(rect, "")) {
				locked = true;
				TimeSeriesController.setCurrentDate(dateRatio.date);
			}
		}

		DrawSlider(timeLineBox, locked);

		//Draw Current Date
		var current_date_text = getDateText(TimeSeriesController.getCurrentDate());
		GUI.Label(timeLineBox, current_date_text, centeredStyle);

		//Restore Alignment.
		centeredStyle.alignment = oldAlignment;


	}

	function DrawSlider(timeLineBox : Rect, locked : boolean) {

		var sliderX : int;
		var mousePosition = Input.mousePosition;
		mousePosition.y = Screen.height - mousePosition.y; //Stupid Unity.

		if (sliding) {
			sliderX = Mathf.Clamp(mousePosition.x, timeLineBox.x, timeLineBox.x+timeLineBox.width);
			var ratio : float = (sliderX - timeLineBox.x) / timeLineBox.width;
			TimeSeriesController.setCurrentDate(TimeSeriesController.ratioToDate(ratio));
		} else {
			ratio = TimeSeriesController.dateToRatio(TimeSeriesController.getCurrentDate());
			sliderX = timeLineBox.x+ratio*timeLineBox.width;
		}

		var sliderRect = new Rect(sliderX-5, timeLineBox.y+5, 10, timeLineBox.height-10);
		if (TimeSeriesController.getEnabled()) {
			GUI.color = Attribute.TIME_SERIES_COLOR;
		}
		GUI.Button(sliderRect, ""); 
		GUI.color = Color.white;

		//Decide if it should be sliding next frame.
		if (!Input.GetMouseButton(0)) {
			sliding = false; //If the user releases the mouse, stop sliding.
		} else if (!locked && Input.GetMouseButtonDown(0) && timeLineBox.Contains(mousePosition) || sliderRect.Contains(mousePosition)){
			sliding = true; //If the user clicks inside the box, start sliding
		} 



	}

	static function getDateText(current_date : Date) {
		//TODO: Respect options for what to show.
		return "" + current_date;
	}

	function DrawButtons(y:int) {
		var buttonLeft = x + width * .85 + 5;
		var buttonSide = (width*.15 - 30)/3;
		var buttonRect = new Rect(buttonLeft+5, y+(Screen.height - y - buttonSide)/2 , buttonSide, buttonSide);
		//BackButton
		if (GUI.Button(buttonRect, prev)) {
			TimeSeriesController.skipToPrev();
		}

		buttonRect.x+=buttonSide+5;
		if (TimeSeriesController.isPlaying()) {
			var image = pause;
		} else {
			image = play;
		}
		if (GUI.Button(buttonRect, image)) {
			TimeSeriesController.togglePlaying();
		}

		buttonRect.x+=buttonSide+5;
		if (GUI.Button(buttonRect, next)) {
			TimeSeriesController.skipToNext();
		}
	}

}