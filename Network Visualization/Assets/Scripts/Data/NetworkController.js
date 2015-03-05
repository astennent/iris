#pragma strict
import System.IO;

static var nodePrefab : GameObject;
var instanceNodePrefab : GameObject;

static var edgePrefab : GameObject;
var instanceEdgePrefab : GameObject;

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
   edgePrefab = instanceEdgePrefab;
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

static function getInstance() {
	return GameObject.FindGameObjectWithTag("GameController").GetComponent(NetworkController);
}