#pragma strict

class PlanarityController extends MonoBehaviour {

	private static var flat = false;

	static function isFlat() {
		return flat;
	}
	static function toggleFlat() {
		if (flat) {
			scatterNodes();
		}
		flat = !flat;
	}

	function Update(){
		if (Input.GetButtonDown("Scatter")){
			scatterNodes();
		}
		
		if (Input.GetButtonDown("Flatten")){
			toggleFlat();
		}
	}

	static function scatterNodes() {
		for (var file in FileManager.files){
			var nodes = file.getNodes();
			for (var node in nodes){ //loop over the node names
				var randPos : Vector3 = new Vector3(Random.Range(-1000, 1000), Random.Range(-1000, 1000), Random.Range(-1000, 1000));
				node.transform.position = randPos;
			}
		}
	}
}