#pragma strict
import System.Collections.Generic;

var centrality_types : String[];

private var clusterController : ClusterController;
private var initialized : boolean[]; //tracks whether each of the centrality measures has been calculated.

//degree centrality variables
var degreeCentralities : Dictionary.<Node, float>; //key node to value degree centrality. (# nodes)

//closeness centrality variables
private var distanceSums : Dictionary.<Node, float>;
private var invertedDistanceSums : Dictionary.<Node, float>;

function Start(){
	clusterController = this.GetComponent(ClusterController);
	centrality_types = ["Degree", "Closeness", "Betweenness (NA)", "Eigenvector (NA)"];
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
	degreeCentralities = new Dictionary.<Node, float>();

	for (var entry in clusterController.group_dict) {
		var nodes = entry.Value;
		for (var node in nodes) {			
			//Degree centrality is simply a count of connected nodes.
			var node_centrality = node.connections.Count;
			degreeCentralities[node] = node_centrality;
		}
	}
}


function CalculateClosenessCentrality(){
	distanceSums = new Dictionary.<Node, float>();
	invertedDistanceSums = new Dictionary.<Node, float>();

	for (var entry in clusterController.group_dict) {
		var nodes = entry.Value;
		for (var from_node in nodes) {			
			//update the distance and inverted distance sums
			CalculateDistanceSums(from_node);	
		}
	}
}


function CalculateDistanceSums(from_node : Node) {
	var alreadySeen = new HashSet.<Node>();

	var node_queue = new Queue.<Node>();
	var count_queue = new Queue.<int>();
	node_queue.Enqueue(from_node);
	count_queue.Enqueue(0);

	var total_distance = 0;
	var total_inverted_distance = 0;
	while(node_queue.Count > 0) {
		var cur_node = node_queue.Dequeue();
		var cur_count = count_queue.Dequeue();
		total_distance += cur_count;
		total_inverted_distance += (1.0/cur_count);
		for (var connection : Connection in cur_node.connections) {
			var connection_node = connection.to;
			if (! (alreadySeen.Contains(connection_node))){
				alreadySeen.Add(connection_node);
				node_queue.Enqueue(connection_node);
				count_queue.Enqueue(cur_count+1);
			}
		}
	}
	distanceSums[from_node] = total_distance;
	invertedDistanceSums[from_node] = total_distance;
}

function CalculateBetweennessCentrality(){

}

function CalculateEigenvectorCentrality(){

}

function getCentralityFraction(node: Node, rule : ColorRule) {
	var centrality_type = rule.getCentralityType();
	Init(centrality_type); //this is a no-op if it's already initialized.

	var inter_cluster = rule.getInterCluster();
	var relevant_dictionary : Dictionary.<Node, float>; //chosen depending on centrality type and subtype.

	if (centrality_type == 0) {
		relevant_dictionary = degreeCentralities;
	} else if (centrality_type == 1) {
		if (inter_cluster) {
			relevant_dictionary = invertedDistanceSums;
		} else {
			relevant_dictionary = distanceSums;
		}
	} else if (centrality_type == 2) {
		return 0;
	} else {
		return 0;
	}

	var node_centrality : float = relevant_dictionary[node];
	var max_centrality : float = 0;
	var min_centrality : float = int.MaxValue;
	for (var entry in relevant_dictionary) {		
		var cur_node = entry.Key;
		if (inter_cluster || cur_node.group_id == node.group_id) {
			var centrality = entry.Value;
			if (centrality > max_centrality){
				max_centrality = centrality;
			} 
			if (centrality < min_centrality) {
				min_centrality = centrality;
			}
		}
	}

	return makeFraction(node_centrality, min_centrality, max_centrality);
}



function getBetweennessFraction(node : Node, rule : ColorRule) {
	return 0;
}

function getEigenvectorFraction(node : Node, rule : ColorRule) {
	return 0;
}

function makeFraction(node_centrality : float, min_centrality : float, max_centrality : float) {
	return (node_centrality - min_centrality + .1) / (max_centrality - min_centrality - .001);
}
