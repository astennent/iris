import System.IO;

#pragma strict

static var files = new List.<DataFile>();
static var demoMode = true;

function Start(){
	if (demoMode){
		Load("Full Group Attributes", true);
		Load("Alliance Edge List - Names", true);
		
		//Custom configuration
		var full_group_attrs : DataFile = files[0];
		var alliance_edge_list : DataFile = files[1];
		
		var fga_id : Attribute = full_group_attrs.getAttribute(0);
		var fga_name : Attribute = full_group_attrs.getAttribute(1);
		fga_id.is_shown = false;
		fga_id.is_pkey = false;
		fga_name.is_pkey = true;

		full_group_attrs.Activate();
		
		var ael_ego : Attribute = alliance_edge_list.getAttribute(0);
		var ael_alter : Attribute = alliance_edge_list.getAttribute(1);
		ael_alter.is_pkey = false;
		ael_ego.is_shown = false;
		ael_alter.is_shown = false;
		alliance_edge_list.linking_table = true;
		alliance_edge_list.createSimpleFkey(full_group_attrs, ael_ego, fga_name);
		alliance_edge_list.createSimpleFkey(full_group_attrs, ael_alter, fga_name);
		alliance_edge_list.Activate();	

		//Guatamala
		Load("Guatamala", true);
		var guatamala = files[2];
		guatamala.getAttribute(0).is_shown = false;
		guatamala.getAttribute(0).is_pkey = false;
		guatamala.getAttribute(2).is_pkey = true;
		guatamala.getAttribute(3).is_pkey = true;
		guatamala.createSimpleFkey(full_group_attrs,  guatamala.getAttribute(4), fga_name);
		guatamala.Activate();

		//TimeFrame
		full_group_attrs.timeFrame.addColumn(full_group_attrs.getAttribute(2), true);
		full_group_attrs.timeFrame.getColumns(true)[0].setTimeFrameFormat("yyyy");
		full_group_attrs.timeFrame.addColumn(full_group_attrs.getAttribute(3), false);
		full_group_attrs.timeFrame.getColumns(false)[0].setTimeFrameFormat("yyyy");
		guatamala.timeFrame.addColumn(guatamala.getAttribute(1), true);
		guatamala.timeFrame.getColumns(true)[0].setTimeFrameFormat("MM/dd/yyyy");

	}
}

function Update() {
	for (var file in files) {
		file.Update();
	}
}

static function getFileNames() : String[]{
	var output = new String[files.Count];
	for (var i = 0 ; i < files.Count ; i++) {
		output[i] = files[i].shortName();
	}
	return output;
}

//returns the index of the file created, or -2 if nothing is made.
static function Load(fname : String) : int {
    return Load(fname, false);
}

//TODO: Make these print statements pop up dialogs.
static function Load(fname : String, isDemo : boolean) : int {
	if (isDemo || File.Exists(fname)){
		for (var file : DataFile in files){
			if (file.fname == fname){
				print("You've already loaded that file.");
				return -2;
			}
		}

		var new_file = new DataFile(fname, isDemo);
		files.Add(new_file);

		new_file.generateAttributes();
		return files.Count-1;

	} else if (Directory.Exists(fname)){
		print("That's a directory. Select a file.");
		return -2;
	} else {
		print("File not found.");
		return -2;
	}
}

static function DeactivateFile(index : int) {
	files[index].Deactivate();
}

static function ActivateFile(index : int) {
	files[index].Activate();
}

static function RemoveFile(index : int) {
	//Only allow files to be deleted if they have no dependents
	var dependent_files = files[index].determineDependents();
	if (dependent_files.Count == 0) {
		files[index].Deactivate();
		files.RemoveAt(index);

	} else {
		Terminal.E("Cannot remove file with dependencies: There are " +
				dependent_files.Count + " files dependent on " + files[index].shortName());
	}
}

static function UpdateNodeSizes(){
	for (var file in files){
		var nodes = file.getNodes();
		for (var node in nodes){
			node.UpdateSize();
		}
	}
}

static function getFileIndex(file : DataFile) {
	for (var i = 0 ; i < files.Count ; i++) {
		if (files[i] == file) {
			return i;
		}
	}
	return -1;
}

//TODO: If this is used often enough, it should be a hashset.
static function getFileFromUUID(uuid : int) {
	for (var file in files) {
		if (file.uuid == uuid) {
			return file;
		}
	}
	return null;
}


static function getAttributeFromUUID(id : int) {
	for (var file in files) {
		var attr = getAttributeFromUUID(id, file);
		if (attr != null) {
			return attr;
		}
	}
	return null;
}
static function getAttributeFromUUID(id : int, file : DataFile) {
	for (var attribute in file.attributes) {
		if (attribute.uuid == id) {
			return attribute;
		}
	}
	return null;
}

static function invalidateAllStats() {
	for (var file in files) {
		file.invalidateAllStats();
	}
}