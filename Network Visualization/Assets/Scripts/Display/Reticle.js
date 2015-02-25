#pragma strict

var node : Node;

function Init (n : Node){
	node = n;
	renderer.material = NetworkController.getReticleTexture();
}

function Update (){
	renderer.material.SetColor ("_TintColor", node.getHaloColor());
	transform.position = node.transform.position;
	transform.localScale = node.transform.localScale * 0.25;
	transform.LookAt(Camera.main.transform.position);
	transform.Rotate(0, 90, 90);
}
