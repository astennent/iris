#pragma strict

static var displaying = false;
static var drawBox = true;

static var left : float = 100;
static var top : float = 100;
private static var width : float = 200;
private static var height : float = 220;

static var hueValue : int = 0;
static var hueValues : Color[];
private static var hueTexture : Texture2D;
private static var maxHue : int = 360;

static var brightnessValue : int = 50;
static var brightnessValues : Color[];
private static var maxBrightness : int = 100;

private static var alphaValue : int = 100;

static var initialColor : Color;
static var chosenColor : Color;

function Start(){
	genHueTexture();
	brightnessValues = new Color[maxBrightness];
	brightnessValue = maxBrightness/2;
}


static function getColor(){
	return chosenColor;
}

static function Init(left : float, top : float, drawBox : boolean){
	this.left = left;
	this.top = top;
	this.drawBox = drawBox;
	displaying = true;
}

function LateUpdate(){
	displaying = false;
}

function OnGUI(){
	if (displaying){

		if(drawBox) {
			GUI.Box(new Rect(left, top, width, height), "");
		}

		var hueRect = new Rect(left+10, top+10, width-20, 10);
		GUI.DrawTexture(hueRect, hueTexture);
		hueValue = GUI.HorizontalSlider(hueRect, hueValue, 0, maxHue-1);

		var brightnessTexture = genBrightnessTexture();
		var brightnessRect = new Rect(left+10, top+30, 10, width-80);
		GUI.DrawTexture(brightnessRect, brightnessTexture);
		brightnessValue = GUI.VerticalSlider(brightnessRect, brightnessValue, 0, maxBrightness-1);


		var alphaTexture = new genAlphaTexture();
		var alphaRect = new Rect(left+width-20, top+30, 10, width-80);
		GUI.DrawTexture(alphaRect, alphaTexture);
		alphaValue = GUI.VerticalSlider(alphaRect, alphaValue, 100, 0);

		var newChosenColor : Color = brightnessValues[brightnessValue];
		newChosenColor.a = alphaValue/100.0;
		GUI.color.a = alphaValue/100.0;
		var selectedColorTexture = new Texture2D(1, 1);
		selectedColorTexture.SetPixel(0, 0, newChosenColor);
		selectedColorTexture.Apply();

		var chosenRect = new Rect(left+40, top+30, width-80, width-80);
		GUI.DrawTexture(chosenRect, selectedColorTexture);

		var presetRect = new Rect(left+15, top+160, 20, 20);
		GUI.color = Color.red;
		if (GUI.Button(presetRect, "")){
			hueValue = 0; brightnessValue = maxBrightness/2;
		}
		
		presetRect.x+=25;
		GUI.color = new Color(1, .5, 0); //orange
		if (GUI.Button(presetRect, "")){
			hueValue = 32; brightnessValue = maxBrightness/2;
		}

		presetRect.x+=25;
		GUI.color = Color.yellow;
		if (GUI.Button(presetRect, "")){
			hueValue = 60; brightnessValue = maxBrightness/2;
		}

		presetRect.x+=25;
		GUI.color = Color.green;
		if (GUI.Button(presetRect, "")){
			hueValue = 120; brightnessValue = maxBrightness/2;
		}

		presetRect.x+=25;
		GUI.color = Color.blue;
		if (GUI.Button(presetRect, "")){
			hueValue = 216; brightnessValue = maxBrightness/2;
		}

		presetRect.x+=25;
		GUI.color = new Color(.8, 0.0, 1.0); //purple
		if (GUI.Button(presetRect, "")){
			hueValue = 270; brightnessValue = maxBrightness/2;
		}

		presetRect.x+=25;
		GUI.color = Color.magenta;
		if (GUI.Button(presetRect, "")){
			hueValue = 300; brightnessValue = maxBrightness/2;
		}

		if (drawBox){
			GUI.color = Color.white;
			var cancelRect = new Rect(left+20, top+190, 75, 20);
			if (GUI.Button(cancelRect, "Cancel")){
				setColor(initialColor);
			}

			GUI.color = newChosenColor;
			GUI.color.a = 1;
	 		var selectRect = new Rect(left+105, top+190, 75, 20);
			if (GUI.Button(selectRect, "Apply")){
				
			}
		}

		if (newChosenColor != chosenColor){
			//print(newChosenColor);
			chosenColor = newChosenColor;
		}

	}
}

static function genBrightnessTexture(){
	var baseColor = hueValues[hueValue];
	var brightnessTexture = new Texture2D(1, maxBrightness);
	for (var i = 0 ; i < maxBrightness ; i++){
		var r; var g; var b;
		if (i < maxBrightness / 2){
			r = Mathf.Lerp(0, baseColor.r, i*2.0/maxBrightness);
			g = Mathf.Lerp(0, baseColor.g, i*2.0/maxBrightness);
			b = Mathf.Lerp(0, baseColor.b, i*2.0/maxBrightness);
		} else {
			r = Mathf.Lerp(baseColor.r, 1, (i-maxBrightness/2)*2.0/maxBrightness);
			g = Mathf.Lerp(baseColor.g, 1, (i-maxBrightness/2)*2.0/maxBrightness);
			b = Mathf.Lerp(baseColor.b, 1, (i-maxBrightness/2)*2.0/maxBrightness);
		}
		var color = new Color(r, g, b);
		brightnessTexture.SetPixel(0, maxBrightness-i-1, color);	
		brightnessValues[i] = color;	
	}
	brightnessTexture.Apply();
	return brightnessTexture;
}

static function genAlphaTexture(){
	var baseColor = brightnessValues[brightnessValue];
	var alphaTexture = new Texture2D(1, 100);
	for (var i = 0 ; i < 100 ; i++){
		var color = baseColor;
		color.a = i/100.0;
		alphaTexture.SetPixel(0, i, color);	
	}
	alphaTexture.Apply();
	return alphaTexture;
}

static function genHueTexture(){
	hueTexture = new Texture2D(maxHue, 1);
	hueValues = new Color[maxHue];
	for (var i = 0 ; i < maxHue ; i++){
		var color = getHueColor(i);
		hueValues[i] = color;
		hueTexture.SetPixel(i, 0, color);
	}
	hueTexture.Apply();
}

static function getHueColor(i : int){
	var sector = Mathf.Floor(i*6/maxHue);
	var position_in_sector = i/(maxHue/6.0)-sector;
	var reverse_position_in_sector = 1 - position_in_sector;
	var r : float; var g : float; var b : float;
	switch(sector){
		case 0:
			r = 1.0;
			g = position_in_sector;
			b = 0.0;
			break;
		case 1:
			r = reverse_position_in_sector;
			g = 1.0;
			b = 0.0;
			break;
		case 2:
			r = 0.0;
			g = 1.0;
			b = position_in_sector;
			break;
		case 3:
			r = 0.0;
			g = reverse_position_in_sector;
			b = 1.0;
			break;
		case 4:
			r = position_in_sector;
			g = 0.0;
			b = 1.0;
			break;
		case 5:
			r = 1.0;
			g = 0.0;
			b = reverse_position_in_sector;
			break;
		;
	}

	return new Color(r, g, b);
}

static function setColor(c : Color){
	//determine the sector you're looking at.
	var r_largest = c.r >= c.g && c.r >= c.b;
	var r_smallest = c.r <= c.g && c.r <= c.b;
	var g_largest = c.g >= c.r && c.g >= c.b;
	var g_smallest = c.g <= c.r && c.g <= c.b;
	var b_largest = c.b >= c.r && c.b >= c.g;
	var b_smallest = c.b <= c.r && c.b <= c.g;

	var sector : int = 0;
	if (r_largest && b_smallest) sector = 0;
	else if (g_largest && b_smallest) sector = 1;
	else if (g_largest && r_smallest) sector = 2;
	else if (b_largest && r_smallest) sector = 3;
	else if (b_largest && g_smallest) sector = 4;
	else if (r_largest && g_smallest) sector = 5;


	//Determine the brightness of the color.
	//Note that this assumes your provided color has at least one of r, g, or b of 0.0 or 1.0.
	//These are the only colors available on this color picker. Because other colors are ugly.
	var bright =(Mathf.Max(c.r, c.g, c.b) == 1.0);
	if (bright){ //find the smallest color, whatever it is, that's how far from the center you are
		var min = Mathf.Min(c.r, c.g, c.b);
		brightnessValue = (.5 + min/2)*maxBrightness;
	} else {
		var max = Mathf.Max(c.r, c.g, c.b);
		brightnessValue = (.5 - max/2)*maxBrightness;
	}

	

	hueValue = sector * maxHue / 6;
	switch (sector){
		case 0:
			hueValue += c.g * maxHue / 6;
			break;
		case 1:
			hueValue += maxHue / 6 - (c.r * maxHue / 6);
			break;
		case 2:
			hueValue += c.b * maxHue / 6;
			break;
		case 3:
			hueValue += maxHue / 6 - (c.g * maxHue / 6);
			break;
		case 4:
			hueValue += c.r * maxHue / 6;
			break;
		case 5:
			hueValue += maxHue / 6 - (c.b * maxHue / 6);
			break;
		;
	}

}