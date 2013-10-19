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
	var t: System.DateTime = System.DateTime.Now;	
	for (var entry in clusterController.group_dict) {
		var nodes = entry.Value;
		for (var from_node in nodes) {
			//Degree centrality is simply a count of connected nodes.
			var total = 0;
			for (var to_node in nodes) {
				var path_length = getShortestPath(from_node, to_node);
				if (path_length < int.MaxValue) {
					total += path_length;
				}
			}
			from_node.setCentrality(1, total);
		}
	}
	var t2: System.DateTime = System.DateTime.Now;
	print (t2-t);
}

/*function getShortestPath(from_node : Node, to_node : Node) :int {
	if (from_node == to_node) {
		return 0;
	}

	var cacheKey = [from_node, to_node];
	if (cacheKey in closenessCache) {
		return closenessCache[cacheKey];
	}

	var alreadyChecked = new HashSet.<Node>();
	var toCheckNodes = new List.<Node>();
	var toCheckCounts = new List.<int>();
	toCheckNodes.Add(from_node);
	toCheckCounts.Add(0);

	var shortestConnectionLength = int.MaxValue;
	while(toCheckNodes.Count > 0) {
		var last_index = toCheckNodes.Count-1;
		var cur_node = toCheckNodes[last_index]; toCheckNodes.RemoveAt(last_index);
		var cur_count = toCheckCounts[last_index]; toCheckCounts.RemoveAt(last_index);
		for (var connection : Connection in cur_node.connections) {
			var connection_node = connection.to;
			if (connection_node == to_node) {
				//if the connecting node is the one you're looking for, stop.
				shortestConnectionLength = cur_count+1;
				break;
			} else if (!alreadyChecked.Contains(connection_node)) {
				toCheckNodes.Add(connection_node);
				toCheckCounts.Add(cur_count+1);

				var connectionKey1 = [from_node, connection_node];
				var connectionKey2 = [connection_node, from_node];
				closenessCache[connectionKey1] = cur_count+1;
				closenessCache[connectionKey2] = cur_count+1;
			}
		}

		alreadyChecked.Add(cur_node);
	}
	closenessCache[cacheKey] = shortestConnectionLength;
	return shortestConnectionLength;
}*/


function getShortestPath(from_node : Node, to_node : Node) :int {
	if (from_node == to_node) {
		return 0;
	}

	//check if you've already calculated this distance.
	var cacheKey = new HashSet.<Node>(); 
	cacheKey.Add(from_node); cacheKey.Add(to_node);
	if (cacheKey in closenessCache) {
		return closenessCache[cacheKey];
	}

	//pair of hashsets that keep track of which nodes have been seen from both sides
	var alreadyChecked = new List.<Dictionary.<Node, int> >();
	alreadyChecked.Add(new Dictionary.<Node, int>());
	alreadyChecked.Add(new Dictionary.<Node, int>());
	alreadyChecked[0][from_node] = 0;
	alreadyChecked[1][to_node] = 1;

    var startTuple = new NodeCountTuple(); startTuple.node = from_node; startTuple.distance = 0;	
	var endTuple = new NodeCountTuple(); endTuple.node = to_node; endTuple.distance = 0;
	//pair of lists of tuples that keep track of which nodes will be considered next.
	var queues = new List.<Queue.<NodeCountTuple> >();
	queues.Add(new Queue.<NodeCountTuple>());
	queues.Add(new Queue.<NodeCountTuple>());
	queues[0].Enqueue(startTuple);
	queues[1].Enqueue(endTuple);

	var leftSide = true; //determines which queues or hashsets you're dealing with
	var shortestConnectionLength = int.MaxValue; //returns if you don't reach the other node

	while(true) {
		if (leftSide) {
			var thisSide = 0;
			var otherSide = 1;
		} else {
			thisSide = 1;
			otherSide = 0;
		}

		if (queues[thisSide].Count == 0) {
			break;
		}

		//Since you'll loop over the current queue until it's drained, use this to queue the next nodes.
		var future_queue = new Queue.<NodeCountTuple>();

		while (queues[thisSide].Count > 0) {
			var cur_tuple = queues[thisSide].Dequeue(); //Pop
			var cur_node = cur_tuple.node;
			var cur_distance = cur_tuple.distance;

			for (var connection : Connection in cur_node.connections) {
				var connection_node = connection.to;

				//You found a match! Add the distances between the nodes and break out.
				if (connection_node in alreadyChecked[otherSide]) {
					shortestConnectionLength = cur_distance + alreadyChecked[otherSide][connection_node] + 1;
					break;
				}

				//You haven't seen this node before
				if (! (connection_node in alreadyChecked[thisSide])) {
					
					//Add it's tuple to the queue.
					var connection_tuple = new NodeCountTuple(); 
					connection_tuple.node = connection_node; connection_tuple.distance = cur_distance+1;
					future_queue.Enqueue(connection_tuple);

					//Update the already seen dict
					alreadyChecked[thisSide][connection_node] = cur_distance + 1;

					//Update the cache for future passes
					var connectionKey = new HashSet.<Node>(); 
					if (leftSide) { 
						connectionKey.Add(from_node);
					} else { 
						connectionKey.Add(to_node);
					}					
					connectionKey.Add(connection_node);
					closenessCache[connectionKey] = cur_distance+1;
				}
			}
		}

		queues[thisSide] = future_queue;
		leftSide = !leftSide; //switch sides.
	}
	closenessCache[cacheKey] = shortestConnectionLength;
	return shortestConnectionLength;
}

private class NodeCountTuple{
	var node : Node;
	var distance : int;
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