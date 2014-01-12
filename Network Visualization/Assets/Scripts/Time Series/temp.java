
public class Whatever() {

	public void run() {
		moveAcrossEmpty();
	}

	private void moveAcrossEmpty() {
		while (frontIsClear()) {
			move();
		}
		turnAround();
		putBeeper();
	}

}