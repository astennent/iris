#pragma strict

private var terrainData : TerrainData;
var heightmapMaterial : Material;

private static var resolution : float = 128;

private static var instance : HeightMap;

function Start () {
	instance = this;

	terrainData = new TerrainData();
	GetComponent(Terrain).terrainData = terrainData;	

	GetComponent(Terrain).materialTemplate = heightmapMaterial;
	terrainData.heightmapResolution = resolution; 

	terrainData.size = Vector3.one * GraphController.getScale(); //real world size

	instance.gameObject.SetActive(false);
}

static function refreshHeightmap() {

	// Disable the heightmap and do not update if you shouldn't show it.
	if (!GraphController.isGraphing() || GraphController.getMethodIndex() != GraphController.HEIGHTMAP) {
		instance.gameObject.SetActive(false);
		return;
	}

	instance.gameObject.SetActive(true);

	var attrX = GraphController.getAxis(0);
	var attrZ = GraphController.getAxis(2);
	var numBucketsX = BarController.getNumBars(0);
	var numBucketsZ = BarController.getNumBars(2);
	var maxCount = 0;
	var numNodes = (attrX != null) ? attrX.getFile().getNodes(true).Count : (attrZ != null) ? attrZ.getFile().getNodes(true).Count : 1;
	for (var x = 0 ; x < numBucketsX ; x++) {
		for (var z = 0 ; z < numBucketsZ ; z++) {
			var height = CountCache.getCount(attrX, attrZ, numBucketsX, numBucketsZ, x, z);
			instance.setHeight(x, z, height * 1.0 / numNodes, numBucketsX, numBucketsZ);
			maxCount = Mathf.Max(maxCount, height);
		}
	}

	instance.GetComponent(Terrain).materialTemplate.SetFloat("_HeightMax", GraphController.getScale() * maxCount / numNodes);

	//Ensure that the borders are all zero so you can see the faces.
	var borderX = new float[1,resolution];
	var borderZ = new float[resolution,1];
	instance.terrainData.SetHeights(0, 0, borderX);
	instance.terrainData.SetHeights(0, 0, borderZ);
	instance.terrainData.SetHeights(0, resolution, borderX);
	instance.terrainData.SetHeights(resolution, 0, borderZ);


	instance.GetComponent(Terrain).Flush();
}

function setHeight(x : int, z : int, height : float, numBucketsX : int, numBucketsZ : int) {
	var chunkSizeX : int = Mathf.Round(resolution/numBucketsX);
	var chunkSizeZ : int = Mathf.Round(resolution/numBucketsZ);

	var heights = new float[chunkSizeZ, chunkSizeX];
	for (var i = 0 ; i < chunkSizeZ ; i++) {
		for (var j = 0 ; j < chunkSizeX ; j++) {
			heights[i,j] = height;			
		}
	}

	var xStart = x * chunkSizeX;
	var zStart = z * chunkSizeZ;

	var xOverflow = xStart + chunkSizeX -resolution;
	if (xOverflow > 0) {
		xStart -= xOverflow;
	} 
	var zOverflow = zStart + chunkSizeZ -resolution;
	if (zOverflow > 0) {
		zStart -= zOverflow;
	}

	terrainData.SetHeights(xStart, zStart, heights);
}