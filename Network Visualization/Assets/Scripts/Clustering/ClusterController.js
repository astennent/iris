//Allows disconnected entities in the graph to move toward each other without colliding.

#pragma strict

static var preferred_distance : float = 200;

static var leaders : Node[];
static var group_dict =  new Dictionary.<int, List.<Node> >(); //2d dict of keys points to arrays of nodes

//Identify groups and store them in the group leader array.
static function ReInit(){
	
	//Reset group ids
	for (var file in FileManager.files){
		var nodes = file.getNodes();
		for (var node in nodes){
			node.cluster_id = -1;
		}
	}
	
	var current_id = 0;
	group_dict.Clear();

	for (var file in FileManager.files){
		nodes = file.getNodes();
		for (node in nodes){ //loop over the node names

			//if you haven't seen this node before, create a new group for it.
			if (node.cluster_id == -1){			
				var to_be_checked : List.<Node> = new List.<Node>();
				to_be_checked.Add(node);
				
				while (to_be_checked.Count > 0){
					var current_node = to_be_checked[to_be_checked.Count-1];
					to_be_checked.RemoveAt(to_be_checked.Count-1);
					current_node.cluster_id = current_id;			
					for (var edge : Edge in current_node.getEdges(true)){
						var other_node = edge.to;
						if (other_node.cluster_id == -1){
							to_be_checked.Add(other_node);
						}
					}
				
				}		
				current_id+=1;		
			}	
		
		}
	}
	
	leaders = new Node[current_id];
	
	//At this point, all nodes' cluster_ids have been initialized. All that's left is to put them in a dictionary.
	var index : int = 0;
	for (var file in FileManager.files){
		nodes = file.getNodes();		
		for (var node in nodes){ //loop over the node names
			if (!group_dict.ContainsKey(node.cluster_id)){
				group_dict[node.cluster_id] = new List.<Node>();
				leaders[index] = node;
				index++;
			}			
			group_dict[node.cluster_id].Add(node);
			
		}
	}

	CentralityController.ReInit();
}

//Disabled until a faster algorithm can be found.
function Update() {
	/*
	if (!NetworkController.isPaused){
		
		var index = 0; 
		for (var leader in leaders){
			//loop over all nodes from the current key and find the shortest distance to the leader node.
			
			var this_cluster_id = leaders[index].cluster_id;	

			var target_index1 = ( index+leaders.length/3 ) % leaders.length; 
			var target_index2 = ( index+leaders.length*2/3) % leaders.length;
			var target_indices = new Array();
			target_indices.Push(target_index1);
			target_indices.Push(target_index2);
			for (target_index in target_indices){
				var target_cluster_id = leaders[target_index].cluster_id;
				var target = group_dict[target_cluster_id][0].transform.position; //the node to which they will be measuring the distance.
				
				var total_dist : float= 0;
				var total_direction = Vector3.zero;
				
				for (var node in group_dict[this_cluster_id]){
					var this_dist = Vector3.Distance(node.transform.position, target);
					total_dist += this_dist;
					total_direction += (target - node.transform.position);
				}	
				
				var average_dist = total_dist / group_dict[this_cluster_id].Count;
				var direction = total_direction.normalized;
										
				average_dist -= preferred_distance; //distance between groups.
				
				//loop over them again to move all nodes the same distance
				for (var node in group_dict[this_cluster_id]){
					node.transform.position += direction*average_dist/100*NetworkController.gameSpeed;
				}
			}
			index++;
		}	
				
	}*/
}