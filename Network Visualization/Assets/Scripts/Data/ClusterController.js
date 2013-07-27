//Allows disconnected entities in the graph to move toward each other without colliding.

var preferred_distance : float = 200;

private var networkController : NetworkController;
var leaders : Array;
var group_dict  = {}; //2d dict of keys points to arrays of nodes

private var fileManager : FileManager;

function Start(){
	networkController = GameObject.FindGameObjectWithTag("GameController").GetComponent(NetworkController);
	fileManager = networkController.GetComponent(FileManager);
}

//Identify groups and store them in the group leader array.
function ReInit(){
	
	//Reset group ids
	for (var file in fileManager.files){
		nodes = file.nodes;
		for (var entry in nodes){
			var node : Node = entry.Value;
			node.group_id = -1;
		}
	}
	
	var current_id = 0;
	group_dict = {};

	for (var file in fileManager.files){
		nodes = file.nodes;
		for (entry in nodes){ //loop over the node names
			node = entry.Value;		
	
			//if you haven't seen this node before, create a new group for it.
			if (node.group_id == -1){			
				var to_be_checked : Array = new Array();
				to_be_checked.Push(node);
				
				while (to_be_checked.length > 0){
					current_node = to_be_checked.Pop();
					current_node.group_id = current_id;			
					for (var connection : Connection in current_node.connections){
						var other_node = connection.to;
						if (other_node.group_id == -1){
							to_be_checked.Push(other_node);
						}
					}
				
				}		
				current_id+=1;
		
			}	
		
		}
	}
	
	leaders = new Node[current_id];
	
	//At this point, all nodes' group_ids have been initialized. All that's left is to put them in a dictionary.
	var index : int = 0;
	for (var file in fileManager.files){
		nodes = file.nodes;		
		for (var entry in nodes){ //loop over the node names
			node = entry.Value;
			if (group_dict[node.group_id] == null){
				group_dict[node.group_id] = new Array();
				leaders[index] = node;
				index++;
			}			
			group_dict[node.group_id].Push(node);
			
		}
	}
}


function Update() {
	if (false && !networkController.paused){
		
		var index=0; 
		for (var leader in leaders){
			//loop over all nodes from the current key and find the shortest distance to the leader node.
			
			var this_group_id = leaders[index].group_id;	

			var target_index1 = ( index+leaders.length/3 ) % leaders.length; 
			var target_index2 = ( index+leaders.length*2/3) % leaders.length;
			var target_indices = new Array();
			target_indices.Push(target_index1);
			target_indices.Push(target_index2);
			for (target_index in target_indices){
				var target_group_id = leaders[target_index].group_id;
				var target = group_dict[target_group_id][0].transform.position; //the node to which they will be measuring the distance.
				
				var total_dist : float= 0;
				var total_direction = Vector3.zero;
				
				for (var node in group_dict[this_group_id]){
					var this_dist = Vector3.Distance(node.transform.position, target);
					total_dist += this_dist;
					total_direction += (target - node.transform.position);
				}	
				
				var average_dist = total_dist / group_dict[this_group_id].length;
				var direction = total_direction.normalized;
										
				average_dist -= preferred_distance; //distance between groups.
				
				//loop over them again to move all nodes the same distance
				for (var node in group_dict[this_group_id]){
					node.transform.position += direction*average_dist/100*networkController.gameSpeed;
				}
			}
			index++;
		}	
				
	}
}