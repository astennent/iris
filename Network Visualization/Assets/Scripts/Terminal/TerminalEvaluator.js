#pragma strict

class TerminalEvaluator {

	function processCommand(input : String) {
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

}
