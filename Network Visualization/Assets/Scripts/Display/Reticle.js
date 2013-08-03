#pragma strict

var node : Node;
private var primary : boolean;

function Init (n : Node){
	node = n;
	renderer.material = new Material(GameObject.FindGameObjectWithTag("GameController").
			GetComponent(NetworkController).reticleTexture);
	
	var color = node.color;
	color.a = .5;
	renderer.material.SetColor ("_TintColor", color);
}

function Update (){
	transform.position = node.transform.position;
	transform.localScale = node.transform.localScale * 0.25;
	transform.LookAt(Camera.main.transform.position);
	transform.Rotate(0, 90, 90);
}