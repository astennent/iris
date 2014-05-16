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
	
}

static function updateHeightmap() {
	print("Updating Heightmap");
	var attrX = GraphController.getAxis(0);
	var attrZ = GraphController.getAxis(2);
	var numBucketsX = BarController.getNumBars(0);
	var numBucketsZ = BarController.getNumBars(2);
	var maxCount = CountCache.getMaxCount(attrX, attrZ, numBucketsX, numBucketsZ);
	for (var x = 0 ; x < numBucketsX ; x++) {
		for (var z = 0 ; z < numBucketsZ ; z++) {
			var height = CountCache.getCount(attrX, attrZ, numBucketsX, numBucketsZ, x, z);
			instance.setHeight(x, z, height * 1.0 / maxCount, numBucketsX, numBucketsZ);
		}
	}

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
	var chunkSizeX : int = resolution/numBucketsX;
	var chunkSizeZ : int = resolution/numBucketsZ;

	var heights = new float[chunkSizeZ, chunkSizeX];
	for (var i = 0 ; i < chunkSizeZ ; i++) {
		for (var j = 0 ; j < chunkSizeX ; j++) {
			heights[i,j] = height;			
		}
	}

	terrainData.SetHeights(x * chunkSizeX, z * chunkSizeZ, heights);
}
