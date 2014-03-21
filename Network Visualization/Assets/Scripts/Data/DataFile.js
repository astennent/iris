//Keeps track of metadata for files and is in charge of creating nodes.

#pragma strict

import System.IO;
import System.Collections.Generic;

var attributes : List.<Attribute>; //Contains an ordered list of attributes of the file (columns)

//What the computer thinks the types should be.
var expected_column_types : boolean[]; //This is global for validation on swapping types.

var using_headers : boolean = true;
var fname : String = "";
var has_nodes; //determines whether the file will generate nodes. Edge files do not generate nodes.
var delimiter : char = ','[0];

var initialized : boolean = false; //used to determine if it should ScanForMetadata on click from the FileMenu. Happens once.
var imported : boolean = false; //used to determine if the file has been imported into the workspace. Deactivate negates this.

var linking_table : boolean = false;

var pkey_indices : int[];
var shown_indices : int[];

var first_row : String[]; 

private var nodes = new Dictionary.<String, Node>();
private var nodeListCache : List.<Node>;
private var nodeListCacheTimed : List.<Node>;
private var hasValidNodeLists = false;

var isDemoFile : boolean = false;

var timeFrame : TimeFrame;

private var foreignKeys = new List.<ForeignKey>();
private var inactiveKeys = new List.<ForeignKey>();

/*
	Logic for headers: If the first row has a number int it, it's probably not a header
	Logic for types: If the entire column (not including header) is numbers, it is a number.
		Otherwise, it's text.
		
	Note that text and numbers can both be foreign keys, but only numbers can have 
		continuous coloring by attribute (vs. discrete colors)
*/	

private var cachedFileContents : List.<List.<String> >; //Contents are stored after load.

class DataFile {

	//Constructor
	public function DataFile(fname : String, isDemo : boolean){
		this.fname = fname; 
		this.isDemoFile = isDemo;
		ScanForMetadata();
	    initialized = true;
	    timeFrame = new TimeFrame(this);
	}

	//Computes header names and creates attributes
	function ScanForMetadata(){
		
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

	function splitLine(line : String) {
		var splitLine = new List.<String>();
		var escaped : boolean = false;

		for (var x :int =0; x < line.Length ; x++){
			if (line[x] == "\""[0]){ //match on quotes
				escaped = !escaped;
			} else if (!escaped && line[x] == delimiter){
				var entry = line.Substring(0, x);
				splitLine.Add(entry);
				line = line.Substring(x+1);
				x=-1;
			}
			if (x == line.Length-1) {
				splitLine.Add(line);
			}
		}
		var output : String[] = new String[splitLine.Count];
	    //remove extra quotes
		for (x = 0 ; x < splitLine.Count ; x++){
			entry = splitLine[x];
			if (entry.Length > 1 && entry[0] == "\"" && entry[entry.Length-1] == "\"") {
				entry = entry.Substring(1, entry.Length-2);
			}
			output[x] = entry;
		}
		return output;
	}

	//determines if the number passed variable is a number.
	function isNumber(n : String) {
		try { 
			var num = float.Parse(n);
			return true;
		} catch (err){
			return false;
		}
	}

	//gets everything in the file name after the trailing /
	function shortName(){
		if (fname.Contains("\\")){
			return fname.Substring(fname.LastIndexOf("\\")+1);
		} else if (fname.Contains("/")){
			return fname.Substring(fname.LastIndexOf("/")+1);
		} else {
			return fname;
		}
	}

	function ToggleUsingHeaders() {
		using_headers = !using_headers;	
	    for (var i = 0 ; i < attributes.Count ; i++){
	    	var attribute : Attribute = attributes[i];
	    	if (using_headers){
	    		attribute.setColumnName(first_row[i]);
	    	} else {
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
		for (var j = 0 ; j < inactiveKeys.Count ; j++){
			var inactiveKey = inactiveKeys[j];
			if (fkey == inactiveKey){
				checkAspectReset(fkey);
				inactiveKeys.RemoveAt(j);
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

	//promote or demote a foreign key based on it's number of attributes.
	//called by ForeignKey
	function promoteFkey(fkey : ForeignKey){
		for (var i = 0 ; i < inactiveKeys.Count ; i++){
			var inactiveKey = inactiveKeys[i];
			if (fkey == inactiveKey){
				foreignKeys.Insert(0, fkey);
				inactiveKeys.RemoveAt(i);
				return;
			}
		}
	}
	function demoteFkey(fkey : ForeignKey){
		for (var i = 0 ; i < foreignKeys.Count ; i++){
			var foreignKey = foreignKeys[i];
			if (fkey == foreignKey){
				foreignKeys.RemoveAt(i);
				inactiveKeys.Insert(0, fkey);
				return;
			}
		}
	}

	//creates an empty foreign key and marks it as inactive.
	function createEmptyFkey(other_file : DataFile){
		var foreignKey = new ForeignKey(this, other_file, this);
		inactiveKeys.Add(foreignKey);
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

	function getForeignKeys(includeInactive : boolean){
		if (includeInactive){
			var output = new List.<ForeignKey>();
			for (var ikey in inactiveKeys){
				output.Add(ikey);
			}
			for (var key in foreignKeys){
				output.Add(key);
			}
			return output;
		}
		return foreignKeys;
	}

	function Activate() {
		Activate(true);
	}

	private function Activate(checkDependencies : boolean){
		//Do nothing if the file has already been .
		if (imported) {
			return;
		}

		//Process dependencies 
		if (checkDependencies) {
			var required_files = determineDependencies(); 
			for (var required_file in required_files){
				required_file.Activate(false); //Do not recalculate dependencies.
			}
		}

		//Process self.
		if (!linking_table) {
			GenerateNodes();
		}
		GenerateConnections();
		
		SearchController.ReInit();
		ClusterController.ReInit();

		imported = true;
	}

	function Deactivate() {
		Deactivate(true);
	}

	private function Deactivate(checkDependents : boolean) {
		if (!imported) {
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
					node.DeactivateConnections(foreignKey);
				}
			}
		} else {
			for (var foreignKey in foreignKeys) {
				var from_file = foreignKey.from_file;
				var to_file = foreignKey.to_file;
				from_file.DeactivateConnections(to_file);
				to_file.DeactivateConnections(from_file);
			}
		}
		for (var node in nodes) {
		 	node.Value.Deactivate();
		}
		nodes = new Dictionary.<String, Node>();
		SearchController.ReInit();
		ClusterController.ReInit();
		imported = false;
	}

	//called by linking table files, executed by non-linking tables.
	function DeactivateConnections(file : DataFile){
		for (var node in nodes){
			node.Value.DeactivateConnections(file);
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
				//see if there's a direct connection to this file.
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
		//TODO: destroy nodes and connections.
		nodes = new Dictionary.<String, Node>();
		UpdatePKeyIndices();
		UpdateShownIndices();

		var fileContents = getFileContents();
		var max = 5;
		var cur = 0;
	    for (var row in fileContents) {
	    	
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
	    }

	    cur++;
	    if (cur > max ) {
	    	i = 0;
	    	var x = 5/i;
	    }	
	    invalidateListCache();  
	}


	function GenerateConnections(){
		if (linking_table){
			GenerateConnectionsForLinkingTable();
		} else {
			GenerateConnectionsForNodeFile();
		}
	}
		
	function GenerateConnectionsForNodeFile() {
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
						
						//You found a match. Generate a connection.
						if (from_attribute_value == to_attribute_value){
							var newConn = from_node.AddConnection(this, to_node, true, foreignKey); 
							//Data should be stored in the node.
							newConn.setDataSource(from_node);
						}
						
					}
				
				}				
			}
		}
	}
		
	function GenerateConnectionsForLinkingTable(){

		var fileContents = getFileContents();
		for (var row in fileContents) {

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
				if (foreignKey.mapsToPrimary()){					
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
			
			//TODO: make n-way connections.

			if (matches.Count == 2){
				for (from_node in matches[0]){
					for (to_node in matches[1]){

						//The first (outgoing) connection is the one that gets a copy of the data.
						var first_conn = from_node.AddConnection(this, to_node, true, foreignKeys[0]);
						first_conn.CopyData(data);	
						//The second (incoming) connection references the data of the first connection.
						var second_conn = to_node.AddConnection(this, from_node, false, foreignKeys[1]);
						second_conn.setDataSource(data);

					}
				}
			}

			//Remove the template used to make those connections.
			MonoBehaviour.Destroy(data);
	    }
		   
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

	function getFirstRow() : String[] {
		try {
			var sr = getStreamReader();

			if (  sr != null && sr.Peek() != -1  ) {
				var line : String = sr.ReadLine();
				return splitLine(line);
			}

			if (sr != null) sr.Close();
		} catch (err){
			print("" + err);
			if (sr != null) sr.Close();
		}

		return null;
	}

	function getFileContents() : List.<List.<String> > {
		
		//If you've already loaded it, use that instead.
		if (cachedFileContents != null) {
			return cachedFileContents;
		}

		var output = new List.<List.<String> >();
		try {		
			var sr = getStreamReader();

			//If you use headers, skip first row.
			var on_first_row = using_headers;

			while (  sr != null && sr.Peek() != -1  ) {
				if (on_first_row) {
					on_first_row = false;
					sr.ReadLine(); //read and drop the first line.
					continue;
				}
				var row = new List.<String>();
				var line : String = sr.ReadLine();
				var splitLine : String[] = splitLine(line);
				for (var cell in splitLine) {
					row.Add(cell);
				}
				output.Add(row);
			}

			if (sr != null) sr.Close();
		} catch (err){
			Debug.Log("" + err);

			if (sr != null) sr.Close();
		}

		//cache for later use.
		cachedFileContents = output;
		
		return output;
	}

	function getStreamReader() : IrisStreamReader{
		var sr : IrisStreamReader = null; //StreamReader interface.
		if (isDemoFile) {
			sr = new DemoStreamReader();
			sr.setCurrentFile(fname);
		} else {
			sr = new DefaultStreamReader();
			sr.setCurrentFile(fname);
		}
		return sr;
	}

	function invalidateListCache() {
		hasValidNodeLists = false;
	}

	function updateNodeLists() {
		nodeListCache = new List.<Node>();
		nodeListCacheTimed = new List.<Node>();
		for (var node in nodes.Values) {
			if (node.hasValidTime()) {
				nodeListCacheTimed.Add(node);
			}
			nodeListCache.Add(node);
		}
		hasValidNodeLists = true;
	}

	function getNodes() {
		return getNodes(false);
	}

	function getNodeDict() {
		return nodes;
	}

	function getNodes(respectTimeSeries : boolean) : List.<Node> {
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