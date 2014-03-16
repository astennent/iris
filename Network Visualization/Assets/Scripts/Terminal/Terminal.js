#pragma strict

class Terminal extends MonoBehaviour {
	private static var maxSize = 500;
	private static var buffer = new Message[maxSize];
	private static var bufferStart : int = 0;
	private static var logicalSize : int = 0;

	static var levels = ["Command", "Verbose", "Warning", "Error"];

	private static var evaluator = new TerminalEvaluator();

	//public shorthand methods
	static function C (text : String, contextObj) { return Log(text, 0, contextObj); }
	static function V (text : String, contextObj) { return Log(text, 1, contextObj); }
	static function W (text : String, contextObj) { return Log(text, 2, contextObj); }
	static function E (text : String, contextObj) { return Log(text, 3, contextObj); }

	private static var previousCommands = new List.<String>();
	private static var previousCommandIndex = 0;

	private static function Log(text : String, level : int, contextObj) {
		var context = contextObj+"";
		var message = new Message(text, level, context);
		if (logicalSize == maxSize) {
			//overwrite old message
			buffer[bufferStart] = message;
			bufferStart = (bufferStart + 1) % maxSize;
		} else {
			var writeIndex = getIndex(logicalSize);
			buffer[writeIndex] = message;
			logicalSize++;
		}
		return message;
	}

	//takes a logical index and adjusts it from the startIndex
	private static function getIndex(logicalIndex : int) {
		return (logicalIndex + bufferStart) % maxSize;
	}

	//return the logical ith message
	static function getMessage(logicalIndex : int) {
		var actualIndex = getIndex(logicalIndex);
		return buffer[actualIndex];
	}

	static function clearBuffer() {
		logicalSize = 0;
	}

	static function bufferSize() {
		return logicalSize;
	}

	static function cycleCommand(up : boolean) {
		if (previousCommands.Count == 0) {
			return "";
		}
		
		var indexAdjust = (up) ? -1 : 1;
		previousCommandIndex += indexAdjust;

		if (previousCommandIndex < 0) {
			previousCommandIndex = previousCommands.Count - 1;
		} else if (previousCommandIndex > previousCommands.Count - 1) {
			previousCommandIndex = 0;
		}

		return previousCommands[previousCommandIndex];
	}

	static function Evaluate(input : String) {
		var result = evaluator.processCommand(input);

		//Don't store consecutive duplicate commands
		if (previousCommands.Count == 0 || input != previousCommands[previousCommands.Count-1]) {
			previousCommands.Add(input);
			previousCommandIndex = previousCommands.Count;
		}

		return result;
	}

}

class Message {
	var text : String;
	var level : int;
	var context : String;
	var timestamp : System.DateTime;
	function Message (text : String, level : int, context : String) {
		this.text = text;
		this.level = level;
		this.context = context;
		timestamp = System.DateTime.Now;
	}
}