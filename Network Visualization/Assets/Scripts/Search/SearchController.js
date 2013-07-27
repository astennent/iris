
private var fileManager : FileManager;
private var searchMenu : SearchMenu;
var matches : Array = new Array();

function Start(){
	fileManager = GetComponent(FileManager);
	searchMenu = GetComponent(SearchMenu);
}

function ReInit(){	
	matches = new Array();
}

function UpdateMatches(searchString : String){	
	scrollPosition = Vector2.zero;			
	matches = new Array();

	for (var file in fileManager.files){
		for (var entry in file.nodes){
			var node = entry.Value;
			if (searchString != "" && node.gameObject.name.Contains(searchString)){
				matches.push(node);
			}					
		}		
	}	
		
	searchMenu.match_index = 0;
}
