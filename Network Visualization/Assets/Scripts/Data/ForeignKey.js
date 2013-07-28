#pragma strict

private var keyPairs = new List.<List.<Attribute> >(); //array of tuples.
var from_file : DataFile; //
var to_file : DataFile;
var isBidirectional : boolean = true;
var activated : boolean = false;

//add a from/to keyPair pair. 
function addKeyPair(from : Attribute, to : Attribute){
	var tuple = new List.<Attribute>();
	tuple.Add(from);
	tuple.Add(to);
	keyPairs.Add(tuple);
	activated = true;
}

function removeKeyPair(from : Attribute, to : Attribute){
	for (var i = 0 ; i < keyPairs.Count ; i++){
		var tuple = keyPairs[i];
		if (tuple[0] == from && tuple[1] == to){
			removeKeyPair(i);
		}
	}
}

function removeKeyPair(index : int){
	keyPairs.RemoveAt(index);
	checkActivated();
}

function checkActivated(){
	if (keyPairs.Count == 0 && activated){
		activated = false;
		from_file.demoteFkey(this);
	} else if (keyPairs.Count > 0 && !activated){
		activated = true;
		from_file.promoteFkey(this);
	}
}

function getKeyPairs(){
	return keyPairs;
}

function isSimpleFkey(from : Attribute, to : Attribute){
	return keyPairs.Count == 1 && keyPairs[0][0] == from && keyPairs[0][1] == to;
}
