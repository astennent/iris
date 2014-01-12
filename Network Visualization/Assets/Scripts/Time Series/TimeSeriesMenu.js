#pragma strict

public class TimeSeriesMenu extends BaseMenu {

	static var height = 65;	
	private var sliding : boolean = false;

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
		guiplus.Box(menuRect, "");

		var box = new Rect(x+width-30, menuRect.y+4, 26, 26);
		if (GUI.Button(box, "X")){
			DisableDisplay();
		};


		if (!displaying) {
			return;
		}

		//Draw the enable button
		var enabled = timeSeriesController.getEnabled();
		var enableRect = new Rect(x+10, y+10, width*.1-20, height-20);
		var enableText : String;
		if (enabled) {
			enableText = "Disable\nTime Series";
		} else {
			GUI.color = Attribute.aspectColors[Attribute.TIME_SERIES];
			enableText = "Enable\nTime Series";
		}

		if (GUI.Button(enableRect, enableText)){
			timeSeriesController.toggleEnabled();
		}
		GUI.color = Color.white;


		//Draw the timeline
		DrawTimeline(y);
		
	}

	function DrawTimeline(y : int) {

		var centeredStyle : GUIStyle;
		centeredStyle = GUI.skin.GetStyle("Label");
		centeredStyle.alignment = TextAnchor.MiddleCenter;

		var lineX = x + width * .1;
		var lineWidth = width * .8;
		var timeLineBox = new Rect(lineX, y+10, lineWidth, height-20);

		GUI.color = new Color(1, 1, 1, .5);
		GUI.Box(timeLineBox, "");
		GUI.color = Color.white;

		var dates = timeSeriesController.getDates(lineWidth);
		
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
		for (var dateRatio in dates) {
			var ratio : float = dateRatio.ratio;
			var date_x = lineX + ratio*lineWidth;
			var rect = new Rect(date_x-5, timeLineBox.y, 10, timeLineBox.height);
			if (GUI.Button(rect, "")) {
				locked = true;
				timeSeriesController.setCurrentDate(dateRatio.date);
			}
		}

		DrawSlider(timeLineBox, locked);

		//Draw Current Date
		var current_date_text = getDateText(timeSeriesController.getCurrentDate());
		GUI.Label(timeLineBox, current_date_text, centeredStyle);
	}

	function DrawSlider(timeLineBox : Rect, locked : boolean) {

		var sliderX : int;
		var mousePosition = Input.mousePosition;
		mousePosition.y = Screen.height - mousePosition.y; //Stupid Unity.

		if (sliding) {
			sliderX = Mathf.Clamp(mousePosition.x, timeLineBox.x, timeLineBox.x+timeLineBox.width);
			var ratio : float = (sliderX - timeLineBox.x) / timeLineBox.width;
			timeSeriesController.setCurrentDate(timeSeriesController.ratioToDate(ratio));
		} else {
			ratio = timeSeriesController.dateToRatio(timeSeriesController.getCurrentDate());
			sliderX = timeLineBox.x+ratio*timeLineBox.width;
		}

		var sliderRect = new Rect(sliderX-5, timeLineBox.y+5, 10, timeLineBox.height-10);
		GUI.Button(sliderRect, ""); 

		//Decide if it should be sliding next frame.
		if (!Input.GetMouseButton(0)) {
			sliding = false; //If the user releases the mouse, stop sliding.
		} else if (!locked && Input.GetMouseButtonDown(0) && timeLineBox.Contains(mousePosition) || sliderRect.Contains(mousePosition)){
			sliding = true; //If the user clicks inside the box, start sliding
		} 



	}

	function getDateText(current_date : Date) {
		//TODO: Respect options for what to show.
		return "" + current_date;
	}

}