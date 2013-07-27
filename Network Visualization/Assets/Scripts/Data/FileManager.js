import System.IO;

var files = Array(); //holds File objects.
var filePrefab : GameObject;		

var dest_directories : Array = new Array();
var dest_files : Array = new Array();

var demoMode = true;
var demoPrefab : GameObject;

private var fileMenu : FileMenu;

function Start(){
	fileMenu = GetComponent(FileMenu);
	groupController = GetComponent(FileMenu);
	if (demoMode){
		Load("Full Group Attributes", true);
		Load("Alliance Edge List - Names", true);
		
		//Custom configuration
		var full_group_attrs : DataFile = files[0];
		var alliance_edge_list : DataFile = files[1];
		
		var fga_id : DataFileAttribute = full_group_attrs.attributes[0];
		var fga_name : DataFileAttribute = full_group_attrs.attributes[1];
		fga_id.is_shown = false;
		fga_id.is_pkey = false;
		fga_name.is_pkey = true;
		full_group_attrs.Activate();
		
		var ael_ego : DataFileAttribute = alliance_edge_list.attributes[0];
		var ael_alter : DataFileAttribute = alliance_edge_list.attributes[1];
		ael_alter.is_pkey = true;
		alliance_edge_list.createFkey(full_group_attrs, ael_ego, fga_name);
		alliance_edge_list.createFkey(full_group_attrs, ael_alter, fga_name);
		alliance_edge_list.linking_table = true;
		alliance_edge_list.Activate();	
		//Load("C:\\Users\\Alan\\Desktop\\Dictionaries\\AllianceData\\Alliance Edge List - Names.csv");	
		//Load("C:\\Users\\Alan\\Desktop\\Dictionaries\\AllianceData\\Full Group Attributes.csv");	
	}
}

function UpdateDirectoryData(dest : String){
	UpdateDirectoryData(dest, true, "");
}
function UpdateDirectoryData(dest : String, can_recurse : boolean, ending : String){
	dest_directories = new Array();
	dest_files = new Array();
	try {
		var dest_directory_names = Directory.GetDirectories(dest);
		for (var entry in dest_directory_names){
			var di : DirectoryInfo = new DirectoryInfo(entry);
			if (can_recurse || di.Name.StartsWith(ending)){
				dest_directories.Push(di);
			}
		}
		var dest_file_names = Directory.GetFiles(dest);	
		for (var entry in dest_file_names){
			var fi : FileInfo = new FileInfo(entry);
			if (can_recurse || fi.Name.StartsWith(ending)){
				dest_files.Push(fi);
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
	
	if (dest_directories.length == 1 && dest_files.length == 1 && 
			dest_files[0].Name == dest_directories[0].Name){
		dest_directories = new Array();
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
		//Create the File and attempt to do interpret its contents
		var newfile = GameObject.Instantiate(filePrefab).GetComponent(DataFile);
		newfile.Init();
		newfile.fname = fname;
		newfile.isDemoFile = isDemo;
		newfile.gameObject.name = fname;
		files.Push(newfile);	
		
		newfile.ScanForMetadata();
	
		return files.length-1;
	} else if (Directory.Exists(fname)){
		fileMenu.error_message = "That's a directory. Select a file.";
		return -2;
	} else {
		fileMenu.error_message = "File not found.";
		return -2;
	}
}

function DeactivateFile(index){
	files[index].Deactivate();
}

function ActivateFile(index){
	files[index].Activate();
}


//TODO
function determineDependencies(file : DataFile){
	var output = new Array();
	output.Push(file);
	return output;
}
