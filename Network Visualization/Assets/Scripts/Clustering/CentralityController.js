#pragma strict
import System.Collections.Generic;

//maps group ids to max centrality measures for easy coloring.
private var clusterController : ClusterController;
private var initialized : boolean[]; //tracks whether each of the centrality measures has been calculated.


function Start(){
	clusterController = this.GetComponent(ClusterController);
}

function ReInit() {
		//In case init doesn't happen in the correct order.
	if (clusterController == null) {
		Start();
	}
	initialized = new boolean[4];
}

function Init(measure : int) {
	if (!initialized[measure]) {
		if (measure == 0) {
			CalculateDegreeCentrality();
		} else if (measure == 1) {
			CalculateClosenessCentrality();
		} else if (measure == 2) {
			CalculateBetweennessCentrality();
		} else {
			CalculateEigenvectorCentrality();
		}
		initialized[measure] = true;
	}
}


function CalculateDegreeCentrality(){
	for (var entry in clusterController.group_dict) {
		var nodes = entry.Value;
		for (var node in nodes) {			
			//Degree centrality is simply a count of connected nodes.
			var node_centrality = node.connections.Count;
			node.setCentrality(0, node_centrality);
		}
	}
}


private var closenessCache = new Dictionary.<HashSet.<Node>, int>();		
function CalculateClosenessCentrality(){
	closenessCache = new Dictionary.<HashSet.<Node>, int>();	
	for (var entry in clusterController.group_dict) {
		var nodes = entry.Value;
		for (var from_node in nodes) {
			from_node.setCentrality(1, calculateCloseness(from_node));			
		}
	}
}

function calculateCloseness(from_node : Node) : int{

	var alreadySeen = new HashSet.<Node>();

	var node_queue = new Queue.<Node>();
	var count_queue = new Queue.<int>();
	node_queue.Enqueue(from_node);
	count_queue.Enqueue(0);

	var total = 0;
	while(node_queue.Count > 0) {
		var cur_node = node_queue.Dequeue();
		var cur_count = count_queue.Dequeue();
		total += cur_count;
		for (var connection : Connection in cur_node.connections) {
			var connection_node = connection.to;
			if (! (alreadySeen.Contains(connection_node))){
				alreadySeen.Add(connection_node);
				node_queue.Enqueue(connection_node);
				count_queue.Enqueue(cur_count+1);

			}
		}
	}
	return total;
}


function CalculateBetweennessCentrality(){

}

function CalculateEigenvectorCentrality(){

}

//TODO: cache this
function getMaxCentrality(centrality_type : int, group_id : int) : int {
	var max :float = 0;
	for (var node in clusterController.group_dict[group_id]){
		var node_centrality = node.getCentrality(centrality_type);
		if (node_centrality > max){
			max = node_centrality;
		}
	}
	return max;
}

function getMinCentrality(centrality_type : int, group_id : int) : int {
	var min : float = int.MaxValue;
	for (var node in clusterController.group_dict[group_id]){
		var node_centrality = node.getCentrality(centrality_type);
		if (node_centrality < min){
			min = node_centrality;
		}
	}
	return min;
}