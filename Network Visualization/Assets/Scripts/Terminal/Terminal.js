#pragma strict

class Terminal extends MonoBehaviour {
	private static var maxSize = 500;
	private static var buffer = new Message[maxSize];
	private static var bufferStart : int = 0;
	private static var logicalSize : int = 0;

	static var levels = ["Command", "Verbose", "Warning", "Error"];

	//public shorthand methods
	static function C (text : String, contextObj) { Log(text, 0, contextObj); }
	static function V (text : String, contextObj) { Log(text, 1, contextObj); }
	static function W (text : String, contextObj) { Log(text, 2, contextObj); }
	static function E (text : String, contextObj) { Log(text, 3, contextObj); }

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