//Keeps track of metadata for files and is in charge of creating nodes.

import System.IO;
import System.Collections.Generic;

var attributePrefab : GameObject;
var nodePrefab : GameObject;

var attributes : List.<DataFileAttribute>; //Contains an ordered list of attributes of the file (columns)

//What the computer thinks the types should be.
var expected_column_types : boolean[]; //This is global for validation on swapping types.

var using_headers : boolean = true;
var fname : String = "";
var has_nodes; //determines whether the file will generate nodes. Edge files do not generate nodes.
var delimiter : char = ','[0];

var initialized : boolean = false; //used to determine if it should ScanForMetadata on click from the FileMenu. Happens once.
var imported : boolean = false; //used to determine if the file has been imported into the workspace. Deactivate negates this.

var linking_table : boolean = false;

var pkey_indices;
var shown_indices;

var first_row : String[]; 

var nodes = {};

var isDemoFile : boolean = false;

/*
	[ [reference_file.fname, {self_attr :: reference_attr} ] }
*/
var fkeys : Array = new Array(); //array of string/dict tuples

/*
	Logic for headers: If the first row has a number int it, it's probably not a header
	Logic for types: If the entire column (not including header) is numbers, it is a number.
		Otherwise, it's text.
		
	Note that text and numbers can both be foreign keys, but only numbers can have 
		continuous coloring by attribute (vs. discrete colors)
*/	

//called initially on load to guess information about data types and header usage.

private var fileManager : FileManager;
private var colorController : ColorController;
private var gameController : GameObject;
private var searchController : SearchController;
private var clusterController : ClusterController;
function Init(){
	gameController = GameObject.FindGameObjectWithTag("GameController");
	colorController = gameController.GetComponent(ColorController);
	fileManager = gameController.GetComponent(FileManager);
	searchController = gameController.GetComponent(SearchController);
	clusterController = gameController.GetComponent(ClusterController);
}

function ScanForMetadata(){
	var on_first_row : boolean= true;
	var first_row_types : boolean[]; //true = number, false = text

	attributes = new List.<DataFileAttribute>();
	column_types = {};
	
	try {
		//Choose between a StreamReader (java.IO) or the custom DemoStreamReader.
		//These serve the same function as each other, but the IO version cannot access files unless running as an exe.
	    var sr = null;
	    var dsr = null;
		if (isDemoFile){
			dsr = fileManager.demoPrefab.GetComponent(DemoStreamReader);
			dsr.setCurrentFile(fname);
		} else {
			sr = new StreamReader(fname);
		}
	    while (  (sr != null && sr.Peek() != -1)   || (dsr != null && dsr.Peek() != -1)  ){
	    	if (sr != null) { 	var line : String = sr.ReadLine(); } 
	    	else { line = dsr.ReadLine(); }
	    	
	    	line = escapeQuotedDelimiters(line);	    
	    		
	    	var splitLine : String[]= line.Split(delimiter);

	    	if (on_first_row){
	    		first_row_types = new boolean[splitLine.Length];
	    		first_row = splitLine;
	    		expected_column_types = new boolean[splitLine.Length];
	    		for (var x : int = 0 ; x < splitLine.Length ; x++){
	    			first_row_types[x] = isNumber(splitLine[x]);
	    			
	    			//found a number in the header row, guessing it's not a header.
	    			if (first_row_types[x] == true){
	    				using_headers = false;
	    			}
	    			
	    			expected_column_types[x] = true;
	    		}
	    	} else {
	    		for (x = 0 ; x < expected_column_types.Length ; x++){
	    			if (expected_column_types[x]){ //if it might still be an integer.
	    				//if this is a number, it stays a number. Otherwise, the entire column will be interpretted as text.
	    				expected_column_types[x] = isNumber(splitLine[x]); 
	    			}
	    		}
	    	}

    		on_first_row = false;
	    }
	    
	    for (i = 0 ; i < first_row.Length ; i++){
	    	if (using_headers){
	    		column_name = first_row[i];
	    	} else {
	    		column_name = 'col'+i;
	    	}
    		var attribute = GameObject.Instantiate(attributePrefab).GetComponent(DataFileAttribute);
    		attribute.column_name = column_name;
    		attribute.is_numeric = expected_column_types[i];
    		attribute.file = GetComponent(DataFile);
    		attribute.column_index = i;
    		if (i == 0 || column_name.ToLower().Contains("name") || column_name.ToLower().Contains("title")){
    			attribute.is_shown = true;
    		} 
    		if (i == 0 || column_name.ToLower() == "id"){
    			attribute.is_pkey = true;
    		}
    		attributes.Add(attribute);
	    } 	   
	    
	    if (sr != null) sr.Close();
    } catch (err){
    	print("" + err);
    	if (sr != null) sr.Close();
    }
    initialized = true;
}

function escapeQuotedDelimiters(line : String){
	var escaped : boolean = false;
	for (var x :int =0 ; x < line.Length ; x++){
		if (line[x] == "\""[0]){ //match on quotes
			escaped = !escaped;
		} else if (escaped && line[x] == delimiter){
			line = line.Substring(0,x) + "\\" + line.Substring(x);
			x++;
		}
	}
	return line;
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

function ToggleUsingHeaders(){
	using_headers = !using_headers;	
    for (var i = 0 ; i < attributes.Count ; i++){
    	var attribute : DataFileAttribute = attributes[i];
    	if (using_headers){
    		attribute.column_name = first_row[i];
    	} else {
    		attribute.column_name = 'col'+i;
    	}
    } 	
}

function ToggleNumeric(index : int){
	expected_column_type = expected_column_types[index];
	if (expected_column_type){ //You can only switch if each cell in the column is a valid number.
		attributes[index].is_numeric = !attributes[index].is_numeric;
	} else {
		print("Can't change that column type " + index + " " + attributes[index].column_name);
	}
}

function ToggleShown(index : int){
	attributes[index].ToggleShown();
}


function removeFKey(index){
	//TODO: verification box.
	//TODO: deactivate connections
	fkeys.RemoveAt(index);
}

function createFkey(other_file: DataFile, from : DataFileAttribute, to : DataFileAttribute){
	//generate a simple fkey.
	var fkey = new Object[3];
	fkey[0] = other_file;
	fkey[1] = {};
	fkey[1][from] = to;
	fkey[2] = true;  //bidirectional
	fkeys.Push(fkey);
}

function destroyFkey(from : DataFileAttribute, to : DataFileAttribute){
	var doomed_index = getSimpleFkeyIndexOf(from, to);
	removeFKey(doomed_index);
}

//only returns true if attribute is found AND the size of that dictionary is 1.
function getSimpleFkeyIndexOf(from : DataFileAttribute, to : DataFileAttribute){
	for (var i : int =0 ; i < fkeys.length ; i++){
		fkey = fkeys[i];
		var found = false;
		var count = 0;
		for (var entry in fkey[1]){
			if (entry.Key == from && entry.Value == to){
				found = true;
			}
			count++;
		}
		if (found && count==1){
			return i;
		}
	}
	return -1;	
}

//returns true if this object can be found anywhere as a referencing foreign key
function containsFkeyFrom(attribute : DataFileAttribute){
	for (var fkey in fkeys){
		for (var entry in fkey[1]){
			var entry_from_attr = entry.Key;
			if (attribute == entry_from_attr){
				return true;
			}
		}
	}
	return false;
}

function Activate(){
	required_files = fileManager.determineDependencies(GetComponent(DataFile)); //not implemented.
	for (var required_file in required_files){
		if (!required_file.linking_table){
			required_file.GenerateNodes();
		}
	}
	for (var required_file in required_files){
		required_file.GenerateConnections();
	}
	
	searchController.ReInit();
	clusterController.ReInit();

	imported = true;
	
}

function GenerateNodes(){
	//TODO: destroy nodes and connections.
	nodes = {};
	UpdatePKeyIndices();
	UpdateShownIndices();
	try {
		//Choose between a StreamReader (java.IO) or the custom DemoStreamReader.
		//These serve the same function as each other, but the IO version cannot access files unless running as an exe.
	    var sr = null;
	    var dsr = null;
		if (isDemoFile){
			dsr = fileManager.demoPrefab.GetComponent(DemoStreamReader);
			dsr.setCurrentFile(fname);
		} else {
			sr = new StreamReader(fname);
		}
	    var line_index = -1;

	    while (  (sr != null && sr.Peek() != -1)   || (dsr != null && dsr.Peek() != -1)  ){
	    	if (sr != null) { 	var line : String = sr.ReadLine(); } 
	    	else { line = dsr.ReadLine(); }
    		
    		line_index++;
	    	//skip the first line if using headers.
	    	if (line_index == 0 && using_headers){
	    		continue;
	    	}	
	    	
	    	var data = new Array();
	    	line = escapeQuotedDelimiters(line);	    
	    		 
	    	var splitLine : String[] = line.Split(delimiter);
	    	for (var i : int = 0 ; i < splitLine.length ; i++){
	    		if (i < attributes.Count){ //in case there are stray commas or whatever
		    		var attribute = attributes[i];
		    		var val : String = splitLine[i];
		    		if (attribute.is_numeric){
		    			data.Push(float.Parse(val));
		    		} else {
		    			data.Push(val);
		    		}
	    		}
	    	}
	    	

	    	
	    	//Add the node to the dict as a key/value pair of pkeys/node.
	    	var node : Node = CreateNode(data);
	    	var key = new Array();
	    	for (var pkey_index in pkey_indices){
	    		key.Push(data[pkey_index]);
	    	}
	    	nodes[key] = node;	    	
	    }
	   
	   if (sr != null) sr.Close();
    } catch (err){
    	if (sr != null) sr.Close();
    }	
}


function GenerateConnections(){
	if (linking_table){
		GenerateConnectionsForLinkingTable();
	} else {
		GenerateConnectionsForNodeFile();
	}
}
	
function GenerateConnectionsForNodeFile(){
	for (var entry in nodes){
		var from_node : Node = entry.Value;
		for (var fkey in fkeys){
			var other_file : DataFile = fkey[0];
			//TODO: special case when the foreign key points exactly to the other file's primary keys.
			
			//loop over other file's nodes. This is n^2 argh
			for (var other_entry in other_file.nodes){
				var to_node : Node = other_entry.Value;	
	
				for (var fkey_pair in fkey[1]){
					fkey_from_attribute_index = fkey_pair.Key.column_index;	
					fkey_from_attribute_value = from_node.data[fkey_from_attribute_index];					
					fkey_to_attribute_index = fkey_pair.Value.column_index;
					fkey_to_attribute_value = to_node.data[fkey_to_attribute_index];							
					
					//You found a match. Generate a connection.
					if (fkey_from_attribute_value == fkey_to_attribute_value){
						from_node.AddConnection(to_node, fkey[2]); //fkey[2] is bidirectional
					}
					
				}
			
			}		
		
		}
	}
}
	
function GenerateConnectionsForLinkingTable(){
	try {
	    var line_index = -1;	

		//Choose between a StreamReader (java.IO) or the custom DemoStreamReader.
		//These serve the same function as each other, but the IO version cannot access files unless running as an exe.
	    var sr = null;
	    var dsr = null;
		if (isDemoFile){
			dsr = fileManager.demoPrefab.GetComponent(DemoStreamReader);
			dsr.setCurrentFile(fname);
		} else {
			sr = new StreamReader(fname);
		}
	    while (  (sr != null && sr.Peek() != -1)   || (dsr != null && dsr.Peek() != -1)  ){
	    	if (sr != null) { 	var line : String = sr.ReadLine(); } 
	    	else { line = dsr.ReadLine(); }
    		
    		
    		
    		line_index++;	    		
	    	//skip the first line if using headers.
	    	if (line_index == 0 && using_headers){
	    		continue;
	    	}	
	    	
	    	var data = new Array();
	    	line = escapeQuotedDelimiters(line);
	    	
			
	    	//determine data values 
	    	var splitLine : String[] = line.Split(delimiter);
	    	for (var i : int = 0 ; i < splitLine.length ; i++){
	    		if (i < attributes.Count){ //in case there are stray commas or whatever
		    		var attribute = attributes[i];
		    		var val : String = splitLine[i];
		    		if (attribute.is_numeric){
		    			data.Push(float.Parse(val));
		    		} else {
		    			data.Push(val);
		    		}
	    		}
	    	}
	    	
	    	var matches = new Array(); //Arrays of matching nodes for each fkey.
	    	
	    	for (i = 0 ; i < fkeys.length ; i++){
	    		fkey = fkeys[i];
	    		other_file = fkey[0];    		
				these_matches = new Array();
				//find matches from side of fkey	
				for (var entry in other_file.nodes){
					var node : Node = entry.Value;
					var matching = true;
					for (fkey_pair in fkey[1]){
						//check if the "to" value is a match
						var fkey_to_attribute_index = fkey_pair.Value.column_index;	
						var fkey_to_attribute_value = node.data[fkey_to_attribute_index];
						var fkey_from_attribute_index = fkey_pair.Key.column_index;
						if (fkey_to_attribute_value != splitLine[fkey_from_attribute_index]){
							matching = false;
						} 
					}
					if (matching){
						these_matches.Push(node);
					}
				}
				matches.Push(these_matches);
			}
				
			//TODO: make n-way connections.
			//TODO: handle bidirectionality being false
			if (matches.length == 2){
				for (from_node in matches[0]){
					for (to_node in matches[1]){
						from_node.AddConnection(to_node, true);	
						to_node.AddConnection(from_node, false);								
					}
				}
			}

	    	
	    	
	    }
	   
	   if (sr!=null)sr.Close();
    } catch (err){
    	print("" + err);
    	if (sr!=null)sr.Close();

    }	
}
	
	
function CreateNode(data){
	var randPos : Vector3 = new Vector3(Random.Range(-1000, 1000), Random.Range(-1000, 1000), Random.Range(-1000, 1000));
	var randColor : Color = colorController.GenRandomColor();
	var node : Node = GameObject.Instantiate(nodePrefab, randPos, transform.rotation).GetComponent(Node);
	node.gameObject.name = "X";
	node.data = data;
	node.color = randColor;
	node.transform.position = randPos;
	node.source = GetComponent(DataFile);
	node.Init();
	return node;
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
	if (output.Length == 0){
		for (i = 0 ; i < attributes.Count ; i++){
			output.Push(i);
		}
	}	
	pkey_indices = output;
}

function GetFKeyFromIndices(fkey){
	var output = new Array();
	for (var entry in fkey[1]){
		var from : DataFileAttribute = entry.Value;
		output.Push(from.column_index);
	}
	return output.sort();	
}

function GetFKeyToIndices(fkey){
	var output = new Array();
	for (var entry in fkey[1]){
		var to : DataFileAttribute = entry.Key;
		output.Push(to.column_index);
	}
	return output.sort();	
}

function Deactivate() {
	for (var fkey in fkeys){
		var from = fkey[0];
		//get the files that the linking table combines. 
		//You only need to look at the first, since they're all the same. //TODO: enforce that.
		for (var attr_pair in fkey[1]){
			var to = attr_pair.Value.file;
			break;
		}
		from.DeactivateConnections(to);
		to.DeactivateConnections(from);
	}
	for (var node in nodes) {
	 	node.Value.Deactivate();
	}
	searchController.ReInit();
	clusterController.ReInit();
	imported = false;
	nodes = {};
}

//called by linking table files, executed by non-linking tables.
function DeactivateConnections(file : DataFile){
	for (var node in nodes){
		node.Value.DeactivateConnections(file);
	}
}