#pragma strict

class RightClickController extends MonoBehaviour {

	var networkController : NetworkController;
	var clusterController : ClusterController;
	var selectionController : SelectionController;
	var rightClickMenu : RightClickMenu;

	var lastClickedNode : Node;
	var startClickTime : float;

	private var node : Node;

	function Start () {
		networkController = GameObject.FindGameObjectWithTag("GameController").GetComponent(NetworkController);
		clusterController = networkController.GetComponent(ClusterController);
		selectionController = networkController.GetComponent(SelectionController);
		rightClickMenu = networkController.GetComponent(RightClickMenu);
	}

	function NodeClick(node : Node) {
		if (lastClickedNode != node) {
			lastClickedNode = node;
			startClickTime = Time.time;
		} else if (Time.time - startClickTime > 0.1) {
			this.node = node;
			selectionController.selectPrimaryNode(node);
			rightClickMenu.ProcessClick();
		}
	}

	function setNode(node : Node) {
		this.node = node;
	}

	function getNode(){
		return node;
	}

	function getCurrentClusterSize() : int {
		return clusterController.group_dict[node.group_id].Count;
	}

}