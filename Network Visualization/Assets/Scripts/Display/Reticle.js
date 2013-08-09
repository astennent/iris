#pragma strict

var node : Node;
private var primary : boolean;

function Init (n : Node){
	node = n;
	renderer.material = new Material(GameObject.FindGameObjectWithTag("GameController").
			GetComponent(NetworkController).reticleTexture);
}

function Update (){
	renderer.material.SetColor ("_TintColor", node.getHaloColor());
	transform.position = node.transform.position;
	transform.localScale = node.transform.localScale * 0.25;
	transform.LookAt(Camera.main.transform.position);
	transform.Rotate(0, 90, 90);
}
