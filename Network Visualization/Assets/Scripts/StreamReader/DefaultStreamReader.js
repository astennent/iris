//Wrapper for the IO StreamReader class, reads files in from harddrive.

#pragma strict

import System.IO;

public class DefaultStreamReader implements IrisStreamReader {

	private var sr : StreamReader;

	function setCurrentFile(fname:String) {
		sr = new StreamReader(fname);
	}

	function ReadLine() : String {
		return sr.ReadLine();
	}

	function Peek() : int {
		return sr.Peek();
	}

	function Close(){
		sr.Close();
	}
}