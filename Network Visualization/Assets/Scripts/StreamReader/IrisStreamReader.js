/*
	StreamReader interfaced, implemented by:
			DefaultStreamReader -- wrapper for the IO StreamReader class, reads files in from harddrive.
			DemoStreamReader -- reads in compiled Strings for use on the web
*/

#pragma strict

public interface IrisStreamReader {

	/*
		Returns an index of -1 if there is nothing left in the reader, 
		otherwise returns the line number being read.
	*/
	function Peek () : int;

	/*
		Returns the next line in the file as a String
	*/
	function ReadLine () : String ;

	/*
		Changes the current file being read to the specified file.
		If another file was being read, it's contents are now discarded or ignoreds.
	*/
	function setCurrentFile (fname : String);

	function Close();

}