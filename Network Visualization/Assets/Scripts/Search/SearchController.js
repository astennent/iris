#pragma strict

private var fileManager : FileManager;
private var searchMenu : SearchMenu;
var matches = new List.<Node>();

function Start(){
	fileManager = GetComponent(FileManager);
	searchMenu = GetComponent(SearchMenu);
}

function ReInit(){	
	matches = new List.<Node>();
}

function UpdateMatches(searchString : String){	
	matches = new List.<Node>();

	for (var file in fileManager.files){
		for (var entry in file.nodes){
			var node = entry.Value;
			if (searchString != "" && node.getDisplayName().Contains(searchString)){
				matches.Add(node);
			}					
		}		
	}	
		
	searchMenu.match_index = 0;
}
