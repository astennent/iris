#pragma strict

static var matches = new List.<Node>();

static function ReInit(){	
	matches = new List.<Node>();
}

static function UpdateMatches(searchString : String){	
	matches = new List.<Node>();

	for (var file in FileManager.files){
		for (var node in file.getNodes()){
			if (searchString != "" && node.getDisplayName().Contains(searchString)){
				matches.Add(node);
			}					
		}		
	}	
		
	SearchMenu.match_index = 0;
}
