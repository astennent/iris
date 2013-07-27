class SecondaryMenu extends PrimaryMenu {

	var parentMenu : PrimaryMenu; //assigned in individual menu files.

	function Start(){
		super.Start();
		desired_x_without_details += width;
		desired_x_with_details += width;
		width = 250;
	}

	function Update () {
		super.Update();

		if (displaying && Input.GetButtonDown("Escape")) {
	    	if (displaying){
	    		DisableDisplay();
	    		parentMenu.SuspendDisableDisplay();
	    	}
	    } 	
	}

	function EnableDisplay(){
		super.EnableDisplay();
		parentMenu.SuspendDisableDisplay();
	}

	function DisableDisplay(){
		super.DisableDisplay();
		parentMenu.ResumeDisableDisplay();
	}

}
