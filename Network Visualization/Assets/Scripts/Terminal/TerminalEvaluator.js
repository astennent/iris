#pragma strict

class TerminalEvaluator {

	function processCommand(input : String) {
		// storeFunctions();

		Terminal.C(input, "Terminal Input");
		var message : String;
		try {
			message = eval(input) + "";
			Terminal.V(message, "Terminal Output");
		} catch (err) {
			message = err.Message;
			Terminal.E(message, "Terminal Output");		
		}
		return message;
	}

	function storeFunctions() {

		/* TODO: find all function names and make them available without class names if they're unique.
			For example, GraphController.toggleGraphing() should just be toggleGraphing(). 
			Also, add some kind of autocompletion or recomendation feature as they type in the terminal.
			
		var usableClasses = NetworkController.getInstance().gameObject.GetComponents(typeof(MonoBehaviour));

		for (var usableClass in usableClasses) {
			var usableType = typeof usableClass;
			Debug.Log(usableType);
			for (var x in usableClass) {
				Debug.Log(x);
			}
		}

		*/
	}

}
