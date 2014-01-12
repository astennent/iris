import System.IO;

#pragma strict

var files = new List.<DataFile>(); //holds File objects.

var dest_directories = new List.<DirectoryInfo>();
var dest_files = new List.<FileInfo>();

var demoMode = true;

private var fileMenu : FileMenu;

function Start(){
	fileMenu = GetComponent(FileMenu);
	if (demoMode){
		Load("Full Group Attributes", true);
		Load("Alliance Edge List - Names", true);
		
		//Custom configuration
		var full_group_attrs : DataFile = files[0];
		var alliance_edge_list : DataFile = files[1];
		
		var fga_id : Attribute = full_group_attrs.attributes[0];
		var fga_name : Attribute = full_group_attrs.attributes[1];
		fga_id.is_shown = false;
		fga_id.is_pkey = false;
		fga_name.is_pkey = true;


		full_group_attrs.Activate();
		
		var ael_ego : Attribute = alliance_edge_list.attributes[0];
		var ael_alter : Attribute = alliance_edge_list.attributes[1];
		ael_alter.is_pkey = true;
		alliance_edge_list.createSimpleFkey(full_group_attrs, ael_ego, fga_name);
		alliance_edge_list.createSimpleFkey(full_group_attrs, ael_alter, fga_name);
		alliance_edge_list.linking_table = true;
		alliance_edge_list.Activate();	

		//TimeFrame
		full_group_attrs.timeFrame.addColumn(full_group_attrs.attributes[2], true);
		full_group_attrs.timeFrame.getColumns(true)[0].setFormat("Year");
		full_group_attrs.timeFrame.addColumn(full_group_attrs.attributes[3], false);
		full_group_attrs.timeFrame.getColumns(false)[0].setFormat("Year");
	}
}

function UpdateDirectoryData(dest : String){
	UpdateDirectoryData(dest, true, "");
}
function UpdateDirectoryData(dest : String, can_recurse : boolean, ending : String){
	dest_directories = new List.<DirectoryInfo>();
	dest_files = new List.<FileInfo>();
	try {
		var dest_directory_names = Directory.GetDirectories(dest);
		for (var entry in dest_directory_names){
			var di : DirectoryInfo = new DirectoryInfo(entry);
			if (can_recurse || di.Name.StartsWith(ending)){
				dest_directories.Add(di);
			}
		}
		var dest_file_names = Directory.GetFiles(dest);	
		for (var entry in dest_file_names){
			var fi : FileInfo = new FileInfo(entry);
			if (can_recurse || fi.Name.StartsWith(ending)){
				dest_files.Add(fi);
			}
		}
	} catch (err){
		if (can_recurse){
			if (dest.Contains("\\")){
				ending = dest.Substring(dest.LastIndexOf("\\")+1);
				dest = dest.Substring(0, dest.LastIndexOf("\\"));
				UpdateDirectoryData(dest, false, ending);
	
			} else if (dest.Contains("/")){
				ending = dest.Substring(dest.LastIndexOf("\\")+1);
				dest = dest.Substring(0, dest.LastIndexOf("/"));
				UpdateDirectoryData(dest, false, ending);
	
			}
		}
	}
	
	if (dest_directories.Count == 1 && dest_files.Count == 1 && 
			dest_files[0].Name == dest_directories[0].Name){
		dest_directories = new List.<DirectoryInfo>();
	}
	
}

//returns the index of the file created, or -2 if nothing is made.
function Load(fname : String){
    return Load(fname, false);
}
function Load(fname : String, isDemo : boolean){
	if (isDemo || File.Exists(fname)){
		for (var file : DataFile in files){
			if (file.fname == fname){
				fileMenu.error_message = "You've already loaded that file.";
				return -2;
			}
		}
		// //Create the File and attempt to do interpret its contents
		// var newfile = GameObject.Instantiate(filePrefab).GetComponent(DataFile);
		// newfile.Init();
		// newfile.fname = fname;
		// newfile.isDemoFile = isDemo;
		// newfile.gameObject.name = fname;
		// files.Add(newfile);	
		
		// newfile.ScanForMetadata();

		var new_file = new DataFile(fname, isDemo);
		files.Add(new_file);	
		return files.Count-1;

	} else if (Directory.Exists(fname)){
		fileMenu.error_message = "That's a directory. Select a file.";
		return -2;
	} else {
		fileMenu.error_message = "File not found.";
		return -2;
	}
}

function DeactivateFile(index : int){
	files[index].Deactivate();
}

function ActivateFile(index : int){
	files[index].Activate();
}

function UpdateNodeSizes(){
	for (var file in files){
		var nodes = file.nodes;
		for (var entry in nodes){
			var node : Node = entry.Value;
			node.UpdateSize();
		}
	}
}
