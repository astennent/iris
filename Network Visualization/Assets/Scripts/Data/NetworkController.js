#pragma strict
import System.IO;

var nodePrefab : GameObject;

private var edgeFile : String = "C:\\Users\\Alan\\Desktop\\Dictionaries\\AllianceData\\Alliance Edge List - Names.csv";
private var delimiter : char = ','[0];
private var idColumnIndex : int = 1;
private var fkeyColumnIndex : int = 0;

var flatten = true;

var gameSpeed : float = 1;
private var paused : boolean = false;

var seeding = true;
var seeds : String[];
var currentSeedIndex : int = 0;

//used to clone the node texture material so you can control the color at runtime.
var nodeTexture : Material;
var lineTexture : Material;
var reticleTexture : Material;
var axisTexture : Material;
var gridTexture : Material;

private var fileManager : FileManager;
private var graphController : GraphController;


function SetSpeed(speed : float){
	gameSpeed = speed;
}

function TogglePause(){
	paused = !paused;
}
function isPaused() {
	return (paused || graphController.isGraphing());
}

function Start(){
	fileManager = GetComponent(FileManager);
	graphController = GetComponent(GraphController);
}

function escapeQuotedDelimiters(line : String){
	var escaped : boolean = false;
	for (var x :int =0 ; x < line.Length ; x++){
		if (line[x] == "\""[0]){ //match on quotes
			escaped = !escaped;
		} else if (escaped && line[x] == delimiter){
			line = line.Substring(0,x) + "\\" + line.Substring(x);
		}
	}
	return line;
}

function Update(){
	if (Input.GetButtonDown("Scatter")){
		for (var file in fileManager.files){
			var nodes = file.nodes;
			for (entry in nodes){ //loop over the node names
				var node = entry.Value;
				var randPos : Vector3 = new Vector3(Random.Range(-1000, 1000), Random.Range(-1000, 1000), Random.Range(-1000, 1000));
				node.transform.position = randPos;
			}
		}
	}
	
	if (Input.GetButtonDown("Flatten")){
		flatten = !flatten;
	}

}
