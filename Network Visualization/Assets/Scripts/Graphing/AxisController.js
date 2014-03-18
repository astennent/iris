#pragma strict

var instanceAxisPrefab : GameObject;
var instanceLabelPrefab : GameObject;

static var axisPrefab : GameObject;
static var labelPrefab : GameObject;

static var initialized = false;

private static var axes : LineRenderer[];
private static var ticks : LineRenderer[];
private static var gridlines : LineRenderer[];

private static var tickCounts : int[];
private static var tickLabels : List.<List.<GUIText> >;
private static var TICK_HEIGHT_SCALE : float = .05;

private static var directions = [Vector3.right, Vector3.up, Vector3.forward];

private static var draw_axes : boolean = true;
private static var draw_gridlines : boolean = true;
private static var draw_tick_labels : boolean = true;

static var redAxis : Material;
static var greenAxis : Material;
static var blueAxis : Material;

var redAxisInstance : Material;
var greenAxisInstance : Material;
var blueAxisInstance : Material;

//Used for instantiating objects.
private static var defaultPosition = Vector3.zero;
private static var defaultRotation = new Quaternion();

private static var fontSizeAdjust = 1500;

static function isDrawingAxes(){
	return draw_axes;
}

static function setDrawingAxes(draw_axes : boolean) {
	this.draw_axes = draw_axes;
	Redraw();
}

static function isDrawingGrid(){
	return draw_gridlines;
}

static function setDrawingGrid(draw_gridlines : boolean) {
	this.draw_gridlines = draw_gridlines;
	Redraw();
}

static function isDrawingLabels(){
	return draw_tick_labels;
}

static function setDrawingLabels(draw_tick_labels : boolean) {
	this.draw_tick_labels = draw_tick_labels;
	Redraw();
}

static function getTickCounts() {
	return tickCounts;
}


function Start () {
	redAxis = redAxisInstance;
	greenAxis = greenAxisInstance;
	blueAxis = blueAxisInstance;
	axisPrefab = instanceAxisPrefab;
	labelPrefab = instanceLabelPrefab;
	axes = new LineRenderer[3];
	gridlines = new LineRenderer[3];
	tickCounts = new int[3];
	ticks = new LineRenderer[3];
	tickLabels = new List.<List.<GUIText> >();

	for (var i = 0 ; i < 3 ; i++) {
		//create the axis
		var axis = GameObject.Instantiate(axisPrefab, defaultPosition, 
				defaultRotation).GetComponent(LineRenderer);
		axes[i] = axis;

		//create the tick renderer
		var tick = GameObject.Instantiate(axisPrefab, defaultPosition, 
				defaultRotation).GetComponent(LineRenderer);
		ticks[i] = tick;

		//create the gridline renderer
		var gridline = GameObject.Instantiate(axisPrefab, defaultPosition, 
				defaultRotation).GetComponent(LineRenderer);
		gridline.material = NetworkController.getGridTexture();
		//gridline.SetWidth(0.2, 0.2);
		gridlines[i] = gridline;

		//initialize ticks to 10
		tickCounts[i] = 10;

		//add an empty list to tickLabels
		tickLabels.Add(new List.<GUIText>());
	}

	axes[0].material = redAxis;
	ticks[0].material = redAxis;

	axes[1].material = greenAxis;
	ticks[1].material = greenAxis;

	axes[2].material = blueAxis;
	ticks[2].material = blueAxis;

	draw_tick_labels = true;
	draw_axes = true;
	draw_gridlines = true;

	initialized = true;
}

function DrawAxes() {

	var should_draw = GraphController.isGraphing() && draw_axes;

	for (var i = 0 ; i < 3 ; i++) {
		var	lineRenderer = axes[i];
		var tickRenderer = ticks[i];
		
		//enable or disable depending on selected options.
		lineRenderer.enabled = should_draw;
		tickRenderer.enabled = should_draw;

		if (should_draw) {

			var scale : float = GraphController.getScale();
			var direction = directions[i];

			//update the position of the main axis.
			lineRenderer.SetPosition(0, Vector3.zero);			
			lineRenderer.SetPosition(1, direction*scale);

			var tickCount = tickCounts[i];
			var lastPosition = Vector3.zero;

			tickRenderer.SetVertexCount(1+5*(tickCount+1));
			tickRenderer.SetPosition(0, lastPosition);	

			//Loop to draw ticks and gridlines.		
			for (var tickIndex = 0 ; tickIndex <= tickCount ; tickIndex++) {
				var pivot = getPivotPosition(tickIndex, i, tickCount);
			
				var tickPositionIndex = 1 + tickIndex*5;
				tickRenderer.SetPosition(tickPositionIndex, pivot);

				//go off in one direction
				var off_direction = directions[(i+1)%3];
				var off_position = pivot + scale*TICK_HEIGHT_SCALE * off_direction;
				tickRenderer.SetPosition(tickPositionIndex+1, off_position);

				//return to pivot
				tickRenderer.SetPosition(tickPositionIndex+2, pivot);

				//go off in the second direction
				off_direction = directions[(i+2)%3];
				off_position = pivot + scale*TICK_HEIGHT_SCALE * off_direction;
				tickRenderer.SetPosition(tickPositionIndex+3, off_position);

				//return again to pivot
				tickRenderer.SetPosition(tickPositionIndex+4, pivot);	

				lastPosition = pivot;
			}			

		} 
	}
}

function DrawGridlines() {
	var should_draw = GraphController.isGraphing() && draw_axes && draw_gridlines;
	
	for (var i = 0 ; i < 3 ; i++) {
		var gridRenderer = gridlines[i];
		gridRenderer.enabled = should_draw;

		if (should_draw) {

			var scale : float = GraphController.getScale();

			var direction1 = directions[i];
			var direction2 = directions[(i+1)%3];
			var direction3 = directions[(i+2)%3];

			var tickCount1 = tickCounts[i];
			var tickCount2 = tickCounts[(i+1)%3];
			var tickCount3 = tickCounts[(i+2)%3];

			var vertexCount = 20000; //TODO
			gridRenderer.SetVertexCount(2); //clear vertices TODO: there's a better way to do this.
			gridRenderer.SetVertexCount(vertexCount);
			var vertex = 0;

			for (var planeIndex = 0 ; planeIndex < tickCount1 ; planeIndex++) {

				//The corner of the plane being drawn.
				var planePivot = Vector3.zero + planeIndex*direction1*scale/tickCount1;
				gridRenderer.SetPosition(vertex++, planePivot);


				//Repeat a zig-zag process along directions 2 and 3.
				for (var j = 0 ; j < 2 ; j++) {

					if (j == 0) {
						var secondaryDirection = direction2;
						var tertiaryDirection = direction3;
						var tickCount = tickCount2;
					} else {
						secondaryDirection = direction3;
						tertiaryDirection = direction2;
						tickCount = tickCount3;
					}

					//zig-zag up the second axis and draw lines in the direction of the third.
					var lastPosition = planePivot;
					for (var lineIndex = 0 ; lineIndex < tickCount ; lineIndex++) {

						//move down the second axis
						var firstPoint = lastPosition+secondaryDirection*scale/tickCount;
						gridRenderer.SetPosition(vertex++, firstPoint);
						
						//jump across in the direction of the third axis
						var secondPoint : Vector3;
						if (lineIndex%2 == 0) {
							secondPoint = firstPoint + tertiaryDirection*scale;
						} else {
							secondPoint = firstPoint - tertiaryDirection*scale;
						}
						gridRenderer.SetPosition(vertex++, secondPoint);

						//update lastPosition
						lastPosition = secondPoint;

					}

					//return to the planePivot.
					if (tickCount % 2 == 1){
						// you are in the opposite corner
						gridRenderer.SetPosition(vertex++, planePivot+secondaryDirection*scale);
					} 
					gridRenderer.SetPosition(vertex++, planePivot);
				}


			}

		}
	}
}

function DrawTickLabels() {
	//reposition labels for camera.
	
	var graphing = GraphController.isGraphing() && draw_tick_labels && draw_axes;
	for (var axis_index = 0 ; axis_index < 3 ; axis_index++) { 
		var attribute = GraphController.getAxes()[axis_index];
		var labels = tickLabels[axis_index];
		var count = labels.Count-1;
		for (var index = 0 ; index < count+1 ; index++) {
			var label = labels[index];
			if (graphing) {
				label.text = ""+(index*attribute.getMax()/count);
			} else {
				label.text = "";
			}

			var labelPosition = getPivotPosition(index, axis_index, count);

			label.transform.position = Camera.main.WorldToViewportPoint(labelPosition);
			var fontSize : float = fontSizeAdjust/Vector3.Distance(Camera.main.transform.position, labelPosition);
			label.fontSize = Mathf.Clamp(fontSize, 10, 25);
		}
	}
}

private static function getPivotPosition(index : int, axis_index : int, count : int) {
	var squashTicks = GraphController.methodRequiresTickSquash();
	var scale : float = GraphController.getScale();
	if (squashTicks && BarController.isRepresentative(axis_index)) {
		var position = (index+.5) * scale / (count+1);
	} else {
		position = index * scale / count;
	}
	return position * directions[axis_index];
}

//called by graph controller when a axis's attribute changes
static function updateAxis(axis_index : int ){
	var attribute = GraphController.getAxes()[axis_index];
	var originalCount = (attribute != null) ? attribute.getUniqueValueCount()-1 : 0;

	var count = originalCount;
	if (originalCount < 0 || originalCount > 10) {
		count = 10; //if there are no values, or too many values, fill in 10 spaces.
	} 

	tickCounts[axis_index] = count;

	//remove old labels
	for (var label in tickLabels[axis_index]) {
		Destroy(label.GetComponent(GUIText));
		Destroy(label.gameObject);
	}

	//populate the gui labels.
	var labels = new List.<GUIText>();
	if (originalCount > 0) {
		for (var index = 0 ; index <= count ; index++) {
			var label = GameObject.Instantiate(labelPrefab, defaultPosition, 
					defaultRotation).GetComponent(GUIText);
			labels.Add(label);
		}
	}
	tickLabels[axis_index] = labels;

	Redraw();
}

static function Redraw() {
	var instance = getInstance();
	instance.DrawAxes();	
	instance.DrawGridlines();	
}

function LateUpdate() {
	DrawTickLabels();
}

static function getInstance() : AxisController {
	return GameObject.FindGameObjectWithTag("GameController").GetComponent(AxisController);
}