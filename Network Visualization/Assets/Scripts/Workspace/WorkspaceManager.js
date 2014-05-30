#pragma strict

import System.Xml;
import System.Xml.Serialization;
import System.IO;

class WorkspaceManager extends MonoBehaviour {

	var printed = false;
	function LateUpdate() {
		if (!printed) {
			if (ColorController.rules.Count > 0) {
				SerializeColorRule(ColorController.rules[0]);
				printed = true;
			}
		}
	}

	function SerializeColorRule(rule : ColorRule) {
		var serializer = new XmlSerializer(typeof(ColorRule));
		var stream = new FileStream(Path.GetFullPath(".")+"/testsave.iml", FileMode.Create);
		serializer.Serialize(stream, rule);
		stream.Close();
	}

	function DeSerializeColorRules(rules : String) {

	}
}