#pragma strict
import System.IO;

static var nodePrefab : GameObject;
var instanceNodePrefab : GameObject;

static var flatten = false;

static var gameSpeed : float = 1;
private static var paused : boolean = false;

static var seeding = true;
static var seeds : String[];
static var currentSeedIndex : int = 0;

//used to clone the node texture material so you can control the color at runtime.
var nodeTexture : Material;
var lineTexture : Material;
var reticleTexture : Material;
var axisTexture : Material;
var gridTexture : Material;

static function getNodeTexture() {
	return getInstance().nodeTexture;
}
static function getLineTexture() {
	return getInstance().lineTexture;
}
static function getGridTexture() {
	return getInstance().gridTexture;
}
static function getReticleTexture() {
	return getInstance().reticleTexture;
}

function Start() {
	nodePrefab = instanceNodePrefab;
}

static function SetSpeed(speed : float){
	gameSpeed = speed;
}

static function TogglePause(){
	paused = !paused;
}
static function isPaused() : boolean {
	return (paused || GraphController.isGraphing());
}

function Update(){
	if (Input.GetButtonDown("Scatter")){
		for (var file in FileManager.files){
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

static function getInstance() {
	return GameObject.FindGameObjectWithTag("GameController").GetComponent(NetworkController);
}