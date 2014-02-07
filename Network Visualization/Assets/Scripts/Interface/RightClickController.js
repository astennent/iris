#pragma strict

class RightClickController extends MonoBehaviour {

	static var lastClickedNode : Node;
	static var startClickTime : float;

	private static var node : Node;

	static function NodeClick(node : Node) {
		if (lastClickedNode != node) {
			lastClickedNode = node;
			startClickTime = Time.time;
		} else if (Time.time - startClickTime > 0.1) {
			this.node = node;
			SelectionController.selectPrimaryNode(node);
			RightClickMenu.ProcessClick();
		}
	}

	static function setNode(node : Node) {
		this.node = node;
	}

	static function getNode(){
		return node;
	}

	static function getCurrentClusterSize() : int {
		return ClusterController.group_dict[node.group_id].Count;
	}

}