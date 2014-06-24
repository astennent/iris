#pragma strict

import System.Xml;
import System.Xml.Serialization;
import System.IO;

class WorkspaceManager extends MonoBehaviour {
	static var is_selecting_save_file = false;
	static var is_selecting_load_file = false;

	static function toggleSelectingSaveFile() {
		if (is_selecting_save_file) {
			stopSelectingSaveFile();
		} else {
			startSelectingSaveFile();
		}
	}

	static function toggleSelectingLoadFile() {
		if (is_selecting_load_file) {
			stopSelectingLoadFile();
		} else {
			startSelectingLoadFile();
		}
	}

	static function startSelectingSaveFile() {
		is_selecting_save_file = true;
		is_selecting_load_file = false;
		FilePicker.centerWindow();
	}

	static function startSelectingLoadFile() {
		is_selecting_load_file = true;
		is_selecting_save_file = false;
		FilePicker.centerWindow();
	}

	static function stopSelectingSaveFile() {
		is_selecting_save_file = false;
	}

	static function stopSelectingLoadFile() {
		is_selecting_load_file = false;
	}

	function OnGUI() {
		if (is_selecting_load_file) {
			FilePicker.PickFile(loadWorkspace, stopSelectingLoadFile,"Open Workspace");
		} else if (is_selecting_save_file) {
			FilePicker.PickFile(saveWorkspace, stopSelectingSaveFile,"Save As...");
		}
	}

	static function saveWorkspace() {
		(new SaveState()).Serialize();
		print("Saving Workspace...");
		stopSelectingSaveFile();
	}

	static function loadWorkspace() {
		print("Loading Workspace... (not implemented)");
		stopSelectingLoadFile();
	}



	class SaveState {

		var MajorVersion = 0;
		var MinorVersion = 1;
		var ColorRules : List.<ColorRule>;
		var DataFiles : List.<DataFile>;
		var current_id = 0;

		// Constructor aggregates the static values
		function SaveState(){
			ColorRules = ColorController.rules;
			DataFiles = FileManager.files;
			current_id = FileManager.current_id;
		}

		function Serialize() {
			var serializer = new XmlSerializer(typeof(SaveState));
			var stream = new FileStream(FilePicker.getFileString(), FileMode.Create);
			serializer.Serialize(stream, this);
			stream.Close();
		}
	} 

}