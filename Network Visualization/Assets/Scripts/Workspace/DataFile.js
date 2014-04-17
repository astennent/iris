//Keeps track of metadata for files and is in charge of creating nodes.

#pragma strict

import System.IO;
import System.Collections.Generic;

class DataFile extends LoadableFile {

	//Used to ensure that files are loaded in the correct order after being activated.
	static var activationQueue = new LinkedList.<DataFile>();

	var attributes : List.<Attribute>; //Contains an ordered list of attributes of the file (columns)

	private var activated : boolean = false; //used to determine if the file has been imported into the workspace. Deactivate negates this.

	// Used for loading a file across multiple frames.
	private var activating : boolean = false;
	private var activatingNodes : boolean = false;
	private var contentIndex : int;

	var linking_table : boolean = false;

	var pkey_indices : int[];
	var shown_indices : int[];

	var first_row : String[]; 

	private var nodes = new Dictionary.<String, Node>();
	private var nodeListCache : LinkedList.<Node>;
	private var nodeListCacheTimed : LinkedList.<Node>;
	private var hasValidNodeLists = false;

	var timeFrame : TimeFrame;

	private var foreignKeys = new List.<ForeignKey>();


	//Constructor
	public static function Instantiate(fname : String, isDemo : boolean) {
		var dataFile = (new GameObject()).AddComponent(DataFile);
		dataFile.fname = fname; 
		dataFile.isDemoFile = isDemo;
		dataFile.generateAttributes();
	    dataFile.timeFrame = new TimeFrame(dataFile);
	    return dataFile;
	}

	function Update() {
		if (activationQueue.Count > 0 && activationQueue.First.Value == this) {
			activationQueue.RemoveFirst();
			ProcessActivate();
		}
	}

	//Computes header names, guesses shown/pkey information, and creates attributes
	function generateAttributes(){
		
		first_row = getFirstRow();

		//If there is a number, it probably doesn't use headers, otherwise it probably does.  
		using_headers = true;
		var first_row = getFirstRow();
		for (var cell in first_row) {
			if (isNumber(cell)) {
				using_headers = false;
			}
		}

		attributes = new List.<Attribute>(); 
	    for (var i = 0 ; i < first_row.Length ; i++){
	    	var column_name : String;
	    	if (using_headers){
	    		column_name = first_row[i];
	    	} else {
	    		column_name = 'col'+i;
	    	}

			var attribute = new Attribute(this, column_name, i);
			if (i == 0 || column_name.ToLower().Contains("name") || column_name.ToLower().Contains("title")){
				attribute.is_shown = true;
			} 
			if (i == 0 || column_name.ToLower() == "id"){
				attribute.is_pkey = true;
			}
			attributes.Add(attribute);
	    } 	
	}

	function ToggleUsingHeaders() {
		using_headers = !using_headers;	
	    for (var i = 0 ; i < attributes.Count ; i++){
	    	var attribute : Attribute = attributes[i];
	    	if (using_headers){
	    		attribute.setColumnName(first_row[i]);
	    	} else {
	    		//TODO: Generate the node.
	    		attribute.setColumnName('col'+i);
	    	}
	    } 	
	}

	function ToggleShown(index : int){
		attributes[index].ToggleShown();
	}


	function removeFkey(fkey : ForeignKey){
		for (var i = 0 ; i < foreignKeys.Count ; i++){
			var foreignKey = foreignKeys[i];
			if (fkey == foreignKey){
				checkAspectReset(fkey);
				foreignKeys.RemoveAt(i);
				return;
			}
		}
	}

	//called by removeFKey. Checks if an attribute's aspect should be reset.
	function checkAspectReset(fkey : ForeignKey) {
		var attributesToReset = new HashSet.<Attribute>();
		
		//Add the 'from' attributes of the doomed fkey. 
		for (var tuple in fkey.getKeyPairs()) {
			attributesToReset.Add(tuple[0]);
		}

		//Loop over all fkeys (except this one) and look for these attributes.
		for (var foreignKey in foreignKeys) {
			if (foreignKey != fkey) {
				for (var tuple in foreignKey.getKeyPairs()) {
					var from_attr = tuple[0];
					if (attributesToReset.Contains(from_attr)) {
						attributesToReset.Remove(from_attr);
					}
				}
			}
		}

		//Any attributes not seen again will remain in the list. Mark them as removed.
		for (var remaining_attr in attributesToReset) {
			remaining_attr.setAspect(Attribute.FOREIGN_KEY, false);
		}


	}

	function UpdateDates() {
		if (linking_table) {
			var alreadyUpdated = new HashSet.<DataFile>();
			alreadyUpdated.Add(this);
			for (var fkey in foreignKeys) {
				var from_file = fkey.from_file;
				var to_file = fkey.to_file;
				if (!alreadyUpdated.Contains(from_file)) {
					from_file.UpdateDates();
					alreadyUpdated.Add(from_file);
				} 
				if (!alreadyUpdated.Contains(to_file)) {
					to_file.UpdateDates();
					alreadyUpdated.Add(to_file);
				}
			}
		} else {
			for (var node in nodes) {
				node.Value.UpdateDate();
			}
		}
	}

	//creates an empty foreign key.
	function createEmptyFkey(other_file : DataFile){
		var foreignKey = new ForeignKey(this, other_file, this);
		foreignKeys.Add(foreignKey);
	}

	function createSimpleFkey(other_file: DataFile, from : Attribute, to : Attribute){
		var foreignKey = new ForeignKey(this, other_file, this);
		foreignKey.addKeyPair(from, to);
		foreignKeys.Add(foreignKey);
	}

	function destroySimpleFkey(from : Attribute, to : Attribute){
		var doomed_key : ForeignKey = getSimpleFkey(from, to);
		removeFkey(doomed_key);
	}

	function getSimpleFkey(from : Attribute, to : Attribute){
		for (var foreignKey in foreignKeys){
			//only returns true if attribute is found and the size of that dictionary is 1.
			if (foreignKey.isSimpleFkey(from, to)){
				return foreignKey;
			}
		}
		return null;	
	}

	//returns true if this object can be found anywhere as a referencing foreign key
	function containsFkeyFrom(attribute : Attribute){
		for (var foreignKey in foreignKeys){
			var keyPairs = foreignKey.getKeyPairs();
			for (var keyPair in keyPairs){
				if (keyPair[0] == attribute){
					return true;
				}
			}
		}
		return false;
	}

	function getForeignKeys(){
		return foreignKeys;
	}

	function isActivated() {
		return activated;
	}

	function isActivating() {
		return activating;
	}

	function Activate() {
		activationQueue.AddLast(this);
	}

	private function ProcessActivate(){
		//Do nothing if the file has already been .
		if (isActivated()) {
			return;
		}

		// Only do this the first time you try to call Activate here.
		if (!activating) {

			//Process possible unactivated dependencies 
			var requiredFiles = determineDependencies(); 
			var queued = false;

			//Check if there are any files that must be activated before this one.
			var requiredQueue = new LinkedList.<DataFile>();
			for (var requiredFile in requiredFiles) {
				if (!requiredFile.isActivated()) {
					requiredQueue.AddFirst(requiredFile);
				}
			}

			// Update the queue so that it will process dependencies in order.
			if (requiredQueue.Count > 0) {
				activationQueue.AddFirst(this);
				for (var requiredFile in requiredFiles) {
					activationQueue.AddFirst(requiredFile);
				}
				return; //Stop and let the next Update() take care of it.
			}


			// Prepare for actual activation.
			activating = true;
			contentIndex = 0;
			activatingNodes = !linking_table; //Skip nodes if linking table.
			nodes = new Dictionary.<String, Node>();

		}

		if (!linking_table && activatingNodes) {
			GenerateNodes();
		}
		if (!activatingNodes) {
			GenerateEdges();
		}

		if (activated) {
			SearchController.ReInit();
			ClusterController.ReInit();
		}
	}

	function Deactivate() {
		Deactivate(true);
	}

	private function Deactivate(checkDependents : boolean) {
		if (!isActivated()) {
			return;
		}

		//Process dependents
		if (checkDependents) {
			var dependent_files = determineDependents();
			for (var dependent_file in dependent_files) {
				dependent_file.Deactivate(false);
			}
		}

		//Process self
		if (linking_table) {
			for (var foreignKey in foreignKeys) {
				for (var node in foreignKey.to_file.getNodes()){
					node.DeactivateEdges(foreignKey);
				}
			}
		} else {
			for (var foreignKey in foreignKeys) {
				var from_file = foreignKey.from_file;
				var to_file = foreignKey.to_file;
				from_file.DeactivateEdges(to_file);
				to_file.DeactivateEdges(from_file);
			}
		}
		for (var node in nodes) {
		 	node.Value.Deactivate();
		}
		nodes = new Dictionary.<String, Node>();
		SearchController.ReInit();
		ClusterController.ReInit();
		activated = false;
		contentIndex = 0;

	}

	//called by linking table files, executed by non-linking tables.
	function DeactivateEdges(file : DataFile){
		for (var node in nodes){
			node.Value.DeactivateEdges(file);
		}
	} 

	//Returns a list of file dependencies based on Foreign Keys
	//Guaranteed to return a topologically sorted list, which can be added in order safely.
	function determineDependencies() {
		return determineDependencies(new HashSet.<DataFile>());
	}

	//Helper function for determineDependencies();
	private function determineDependencies(checked : HashSet.<DataFile>) : List.<DataFile> {
		var output = new List.<DataFile>();
		for (var fkey in foreignKeys) {
			var to_file = fkey.to_file;
			if (!checked.Contains(to_file)) {
				checked.Add(to_file);
				var innerList = to_file.determineDependencies(checked);
				for (var innerFile in innerList) {
					if (!checked.Contains(innerFile)) {
						output.Add(innerFile);
					}
				}
				output.Add(to_file);
			}
		}
		return output;
	}

	//Returns a list of files that are dependent on this file.
	//Guaranteed to return a topologically sorted list, which can be deleted in order safely.
	function determineDependents() {
		var checked = new HashSet.<DataFile>();
		checked.Add(this);
		return determineDependents(checked, new List.<DataFile>());
	}

	//Helper function.
	private function determineDependents(checked : HashSet.<DataFile>, list : List.<DataFile>) : List.<DataFile> {
		for (var file in FileManager.files) {
			if (!checked.Contains(file)) {
				//see if there's a direct edge to this file.
				for (var fkey in file.foreignKeys) {
					if (fkey.to_file == this) {
						checked.Add(file);			
						list.Insert(0, file);
						list = determineDependents(checked, list);
					}
				}			
			}
		}
		return list;
	}

	function GenerateNodes(){
		UpdatePKeyIndices();
		UpdateShownIndices();

		var fileContents = getFileContents();
		for (var rowIndex = contentIndex; rowIndex < fileContents.Count && rowIndex < contentIndex+20; rowIndex++) {

			var row = fileContents[rowIndex];

		    var randPos : Vector3 = new Vector3(Random.Range(-1000, 1000), Random.Range(-1000, 1000), Random.Range(-1000, 1000));
			var node : Node = GameObject.Instantiate(NetworkController.nodePrefab, randPos, new Quaternion(0,0,0,0)).GetComponent(Node);

	    	for (var i : int = 0 ; i < row.Count ; i++){
	    		if (i < attributes.Count){ //in case there are stray commas or whatever
		    		var attribute = attributes[i];
		    		var val : String = row[i];
		    		node.Set(attribute, val);
	    		}
	    	}

			var randColor : Color = ColorController.GenRandomColor(0); //random bright color
			node.Init(randColor, this);
	    	
	    	//Add the node to the dict as a key/value pair of pkeys/node.
	    	var key = new Array();
	    	for (var pkey_index in pkey_indices){
	    		key.Push(node.Get(pkey_index));
	    	}
	    	nodes[key.toString()] = node;
	    	node.UpdateName();


	    	ProgressBar.setProgress(rowIndex * 1.0 / fileContents.Count);
	    }

   	    contentIndex = rowIndex;
	    
	    //You finished loading nodes!
	    if (contentIndex == fileContents.Count) {
	    	activatingNodes = false;
	    	contentIndex = 0;
	    } else {
	    	//You didn't finish, stick in back in the queue. :(
	    	activationQueue.AddFirst(this);
	    }

	    invalidateListCache();  
	}


	function GenerateEdges(){
		if (linking_table){
			GenerateEdgesForLinkingTable();
		} else {
			GenerateEdgesForNodeFile();
		}
	}
		
	function GenerateEdgesForNodeFile() {
		for (var entry in nodes){
			var from_node : Node = entry.Value;
			for (var foreignKey in foreignKeys) {
				var other_file : DataFile = foreignKey.to_file;
				var fkeyPairs = foreignKey.getKeyPairs();
				//TODO: special case when the foreign key points exactly to the other file's primary keys.
				
				//loop over other file's nodes. This is n^2 argh
				for (var to_node in other_file.getNodes()){
		
					for (var pair in fkeyPairs){					

						var from_attribute_index = pair[0].column_index;	
						var from_attribute_value = from_node.Get(from_attribute_index);					
						
						var to_attribute_index = pair[1].column_index;
						var to_attribute_value = to_node.Get(to_attribute_index);							
						
						//You found a match. Generate a edge.
						if (from_attribute_value == to_attribute_value){
							var newConn = from_node.AddEdge(this, to_node, true, foreignKey); 
							//Data should be stored in the node.
							newConn.setDataSource(from_node);
						}
						
					}
				
				}				
			}
		}

		//TODO: Make this work with progress bar.
		StopActivating();
	}
		
	function GenerateEdgesForLinkingTable() {


		var fileContents = getFileContents();
		for (var rowIndex = contentIndex ; rowIndex < fileContents.Count && rowIndex < contentIndex+20; rowIndex++) {

			var row = fileContents[rowIndex];

			//Create a template Object as a Data holder.
			var templateObject = new GameObject();
			var data = templateObject.AddComponent(Data);

	    	for (var i : int = 0 ; i < row.Count ; i++){
	    		if (i < attributes.Count){  //check against attributes count in case there aren't enough commas.
		    		var attribute = attributes[i];
		    		var val : String = row[i];
		    		data.Set(attribute, val);
	    		}
	    	}
	    	
	    	var matches = new List.<List.<Node> >(); //Arrays of matching nodes for each fkey.

	    	for (i = 0 ; i < foreignKeys.Count ; i++) {
	    		var foreignKey = foreignKeys[i];
	    		var other_file = foreignKey.to_file;    		
				var keyPairs = foreignKey.getKeyPairs();
				var these_matches = new List.<Node>();

				//check if the foreign key maps directly onto the target table's primary key.
				if (foreignKey.mapsToPrimary()) {					
					//convert the values of the current line to an array key into the other file's nodes.
					var node_values = new Array();
					for (pair in keyPairs) {
						var from_attribute_index = pair[0].column_index;
						var from_attribute_value = row[from_attribute_index];
						node_values.Push(from_attribute_value); 
					}
					var node_values_string = node_values.toString();
					if (other_file.nodes.ContainsKey(node_values_string)) {
						var node : Node = other_file.nodes[node_values_string];
						these_matches.Add(node); //these_matches should just have the one node.
					}
					matches.Add(these_matches);
				} else {
					//VERY COMPUTATIONALLY EXPENSIVE
					//loops over the nodes in the other file. This makes the operation n^2 	
					for (var entry in other_file.nodes) {
						node = entry.Value;
						var matching = true;
						for (pair in keyPairs){
							//check if the "to" value is a match
							from_attribute_index = pair[0].column_index;
							from_attribute_value = row[from_attribute_index];

							var to_attribute_index = pair[1].column_index;	
							var to_attribute_value = node.Get(to_attribute_index);
							
							if (from_attribute_value != to_attribute_value){
								matching = false;
								break;
							} 
						}
						if (matching){
							these_matches.Add(node);
						}

					}
					matches.Add(these_matches);
				}
			}

			//Update the linked foreign keys so that an update to one can update the other.
			foreignKeys[0].setLinkedFKey(foreignKeys[1]);
			foreignKeys[1].setLinkedFKey(foreignKeys[0]);
			
			//TODO: make n-way edges.
			if (matches.Count == 2){
				for (var from_node in matches[0]){
					for (var to_node in matches[1]){

						//The first (outgoing) edge is the one that gets a copy of the data.
						var first_edge = from_node.AddEdge(this, to_node, true, foreignKeys[0]);
						first_edge.CopyData(data);	
						//The second (incoming) edge references the data of the first edge.
						var second_edge = to_node.AddEdge(this, from_node, false, foreignKeys[1]);
						second_edge.setDataSource(data);
					}
				}
			}

			//Remove the template used to make those edges.
			MonoBehaviour.Destroy(data);
			ProgressBar.setProgress(rowIndex * 1.0 / fileContents.Count);
	    }

	    contentIndex = rowIndex;

	    //You finished loading!
	    if (contentIndex == fileContents.Count) {
	    	StopActivating();
	    } else {
	    	//You didn't finish, stick in back in the queue. :(
	    	activationQueue.AddFirst(this);
	    }
		   
	}		

	private function StopActivating() {
		activating = false;
		activated = true;
		contentIndex = 0;
		ProgressBar.setProgress(1);
	}

	function UpdateShownIndices(){
		var output = new Array();
		for (var i = 0 ; i < attributes.Count ; i++){
			if (attributes[i].is_shown){
				output.Push(i);
			}
		}
		shown_indices = output;
			
		for (var node in nodes){
			node.Value.UpdateName();
		}
	}

	function UpdatePKeyIndices(){
		var output = new Array();
		for (var i = 0 ; i < attributes.Count ; i++){
			if (attributes[i].is_pkey){
				output.Push(i);
			}
		}
		
		//use all attributes if none are selected.
		if (output.length == 0){
			for (i = 0 ; i < attributes.Count ; i++){
				output.Push(i);
			}
		}	
		pkey_indices = output;
	}


	function invalidateListCache() {
		hasValidNodeLists = false;
	}

	function updateNodeLists() {
		nodeListCache = new LinkedList.<Node>();
		nodeListCacheTimed = new LinkedList.<Node>();
		for (var node in nodes.Values) {
			if (node.hasValidTime()) {
				nodeListCacheTimed.AddLast(node);
			}
			nodeListCache.AddLast(node);
		}
		hasValidNodeLists = true;
	}

	function getNodes() {
		return getNodes(false);
	}

	function getNodeDict() {
		return nodes;
	}

	function getNodes(respectTimeSeries : boolean) : LinkedList.<Node> {
		if (!hasValidNodeLists) {
			updateNodeLists();
		}
		return (respectTimeSeries) ? nodeListCacheTimed : nodeListCache;
	}

	function invalidateAllStats() {
		invalidateListCache();
		for (var attribute in attributes) {
			attribute.invalidate();
		}
	}
}