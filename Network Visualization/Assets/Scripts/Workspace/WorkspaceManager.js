#pragma strict

import System.Xml;
import System.Xml.Serialization;
import System.IO;

class WorkspaceManager extends MonoBehaviour {
	var printed = false;
	function LateUpdate() {
		if (!printed) {
			if (ColorController.rules.Count > 0) {
				printed = true;
				(new SaveState()).Serialize();
			}
		}
	}

	class SaveState {

		var Version = 1;
		var ColorRules : List.<ColorRule>;
		var DataFiles : List.<DataFile>;

		// Constructor aggregates the static values
		function SaveState(){
			ColorRules = ColorController.rules;
			DataFiles = FileManager.files;
		}

		function Serialize() {
			var serializer = new XmlSerializer(typeof(SaveState));
			var stream = new FileStream(Path.GetFullPath(".")+"/testsave.iml", FileMode.Create);
			serializer.Serialize(stream, this);
			stream.Close();
		}
	} 

}