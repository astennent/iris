#pragma strict

class LoadableFile extends MonoBehaviour { 

	var using_headers : boolean = true;
	var fname : String = "";
	var isDemoFile : boolean = false;
	var delimiter : char = ','[0];
	protected var cachedFileContents : List.<List.<String> >; //Contents are stored after load.

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
			Terminal.E(""+err);
			if (sr != null) sr.Close();
		}

		//cache for later use.
		cachedFileContents = output;
		
		return output;
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
			Terminal.E(""+err);
			if (sr != null) sr.Close();
		}

		return null;
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



}