#pragma strict
import System.Collections.Generic;

var centrality_types : String[];

private var clusterController : ClusterController;
private var initialized : boolean[]; //tracks whether each of the centrality measures has been calculated.

//degree centrality variables
private var degreeCentralities : Dictionary.<Node, float>; //key node to value degree centrality. (# nodes)
private var minMaxDegreeCache : Dictionary.<int, Dictionary.<int, float> >; 

//closeness centrality variables
private var distanceSums : Dictionary.<Node, float>;
private var invertedDistanceSums : Dictionary.<Node, float>;
private var minMaxDistanceCache : Dictionary.<int, Dictionary.<int, float> >;
private var minMaxInvertedDistanceCache : Dictionary.<int, Dictionary.<int, float> >;

private static var GLOBAL_CLUSTER_ID = int.MaxValue;
 
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

	//initialize the cache
	minMaxDegreeCache = new Dictionary.<int, Dictionary.<int, float> >();
	minMaxDegreeCache[0] = new Dictionary.<int, float>();
	minMaxDegreeCache[1] = new Dictionary.<int, float>();

	degreeCentralities = new Dictionary.<Node, float>();

	for (var entry in clusterController.group_dict) {
		var nodes = entry.Value;
		for (var node in nodes) {			
			//Degree centrality is simply a count of connected nodes.
			var node_centrality : float = node.connections.Count;
			degreeCentralities[node] = node_centrality;

			var group_id = node.group_id;

			//update cluster's min and max
			if (!(group_id in minMaxDegreeCache[0]) || minMaxDegreeCache[0][group_id] > node_centrality) {
				minMaxDegreeCache[0][group_id] = node_centrality;
			}
			if (!(group_id in minMaxDegreeCache[1]) || minMaxDegreeCache[1][group_id] < node_centrality) {
				minMaxDegreeCache[1][group_id] = node_centrality;
			}			

			//update the global min and max
			if ( !(GLOBAL_CLUSTER_ID in minMaxDegreeCache[0]) || minMaxDegreeCache[0][GLOBAL_CLUSTER_ID] > node_centrality) {
				minMaxDegreeCache[0][GLOBAL_CLUSTER_ID] = node_centrality;
			}
			if ( !(GLOBAL_CLUSTER_ID in minMaxDegreeCache[1]) || minMaxDegreeCache[1][GLOBAL_CLUSTER_ID] < node_centrality) {
				minMaxDegreeCache[1][GLOBAL_CLUSTER_ID] = node_centrality;
			}			

		}
	}
}


function CalculateClosenessCentrality(){
	//initialize the caches
	minMaxDistanceCache = new Dictionary.<int, Dictionary.<int, float> >();
	minMaxDistanceCache[0] = new Dictionary.<int, float>();
	minMaxDistanceCache[1] = new Dictionary.<int, float>();
	minMaxInvertedDistanceCache = new Dictionary.<int, Dictionary.<int, float> >();
	minMaxInvertedDistanceCache[0] = new Dictionary.<int, float>();
	minMaxInvertedDistanceCache[1] = new Dictionary.<int, float>();

	distanceSums = new Dictionary.<Node, float>();
	invertedDistanceSums = new Dictionary.<Node, float>();

	for (var entry in clusterController.group_dict) {
		var nodes = entry.Value;
		for (var node in nodes) {			
			//update the distance and inverted distance sums
			CalculateDistanceSums(node);	

			var group_id = node.group_id;
			var node_distance = distanceSums[node];
			var node_inverted_distance = invertedDistanceSums[node];

			//update cluster's min and max distance
			if (!(group_id in minMaxDistanceCache[0]) || minMaxDistanceCache[0][group_id] > node_distance) {
				minMaxDistanceCache[0][group_id] = node_distance;
			}
			if (!(group_id in minMaxDistanceCache[1]) || minMaxDistanceCache[1][group_id] < node_distance) {
				minMaxDistanceCache[1][group_id] = node_distance;
			}			

			//update the global min and max distance
			if ( !(GLOBAL_CLUSTER_ID in minMaxDistanceCache[0]) || minMaxDistanceCache[0][GLOBAL_CLUSTER_ID] > node_distance) {
				minMaxDistanceCache[0][GLOBAL_CLUSTER_ID] = node_distance;
			}
			if ( !(GLOBAL_CLUSTER_ID in minMaxDistanceCache[1]) || minMaxDistanceCache[1][GLOBAL_CLUSTER_ID] < node_distance) {
				minMaxDistanceCache[1][GLOBAL_CLUSTER_ID] = node_distance;
			}	

			//update cluster's min and max inverted distance
			if (!(group_id in minMaxInvertedDistanceCache[0]) || minMaxInvertedDistanceCache[0][group_id] > node_inverted_distance) {
				minMaxInvertedDistanceCache[0][group_id] = node_inverted_distance;
			}
			if (!(group_id in minMaxInvertedDistanceCache[1]) || minMaxInvertedDistanceCache[1][group_id] < node_inverted_distance) {
				minMaxInvertedDistanceCache[1][group_id] = node_inverted_distance;
			}			

			//update the global min and max inverted distance
			if ( !(GLOBAL_CLUSTER_ID in minMaxInvertedDistanceCache[0]) || minMaxInvertedDistanceCache[0][GLOBAL_CLUSTER_ID] > node_inverted_distance) {
				minMaxInvertedDistanceCache[0][GLOBAL_CLUSTER_ID] = node_inverted_distance;
			}
			if ( !(GLOBAL_CLUSTER_ID in minMaxInvertedDistanceCache[1]) || minMaxInvertedDistanceCache[1][GLOBAL_CLUSTER_ID] < node_inverted_distance) {
				minMaxInvertedDistanceCache[1][GLOBAL_CLUSTER_ID] = node_inverted_distance;
			}	


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
	var relevant_cache : Dictionary.<int, Dictionary.<int, float> >;

	if (centrality_type == 0) {
		relevant_dictionary = degreeCentralities;
		relevant_cache = minMaxDegreeCache;
	} else if (centrality_type == 1) {
		if (inter_cluster) {
			relevant_dictionary = invertedDistanceSums;
			relevant_cache = minMaxDistanceCache;
		} else {
			relevant_dictionary = distanceSums;
			relevant_cache = minMaxInvertedDistanceCache;
		}
	} else if (centrality_type == 2) {
		return 0;
	} else {
		return 0;
	}

	var group_id : int;
	if (inter_cluster) {
		group_id = GLOBAL_CLUSTER_ID;
	} else {
		group_id = node.group_id;
	}

	var node_centrality : float = relevant_dictionary[node];
	var min_centrality : float = relevant_cache[0][group_id];
	var max_centrality : float = relevant_cache[1][group_id];

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
