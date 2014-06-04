#pragma strict

// This class is responsible for abstracting away instance counts of nodes matching a certain range in 2 or more attributes
// and then caching the results for reuse between repeated calls and different graphing methods.
class CountCache {

	// Used for single attribute counts
	// attribute -> numBuckets -> countArray
	private static var small_cache = new Dictionary.<Attribute, Dictionary.<int, int[]> >();

	// Used for double attribute counts
	// attribute -> attribute -> numBuckets -> numBuckets -> countMatrix
	private static var cache = new Dictionary.<Attribute, Dictionary.<Attribute, Dictionary.<int, Dictionary.<int, int[,] > > > >();

	static function invalidateCache(attribute : Attribute) {

		if (small_cache.ContainsKey(attribute)) {
			small_cache[attribute].Clear();
		}

		if (cache.ContainsKey(attribute)) {
			cache[attribute].Clear();
		}
		for (var firstAttribute in cache.Keys) {
			if (cache[firstAttribute].ContainsKey(attribute)){
				cache[firstAttribute][attribute].Clear();
			}	
		}
	}

	// Returns the number of matching nodes with the specified coordinates
	static function getCount(attribute1 : Attribute, attribute2 : Attribute, numberBuckets1 : int, numberBuckets2 : int, bucketIndex1 : int, bucketIndex2 : int) : int{
		
		//"Sort" the attributes to avoid reflected matrices
		var inOrder = attributesAreInOrder(attribute1, attribute2);
		var attr1 = (inOrder) ? attribute1 : attribute2;
		var attr2 = (inOrder) ? attribute2 : attribute1;
		var numBuckets1 = (inOrder) ? numberBuckets1 : numberBuckets2;
		var numBuckets2 = (inOrder) ? numberBuckets2 : numberBuckets1;
		var bucket1 = (inOrder) ? bucketIndex1 : bucketIndex2;
		var bucket2 = (inOrder) ? bucketIndex2 : bucketIndex1;

	
		// attr1 is only null if both are null. Exit immediately.
		if (attr1 == null) {
			return 0;
		} 

		// only attr2 is null, so use the small cache.
		if (attr2 == null) {

			if (!small_cache.ContainsKey(attr1) || !small_cache[attr1].ContainsKey(numBuckets1)) {
				calculateCountArray(attr1, numBuckets1);
			}
			return small_cache[attr1][numBuckets1][bucket1];
		}
		
		//Calculate if the values are unknown
		if (!cache.ContainsKey(attr1) || !cache[attr1].ContainsKey(attr2) || !cache[attr1][attr2].ContainsKey(numBuckets1) ||
				!cache[attr1][attr2][numBuckets1].ContainsKey(numBuckets2)) {
			calculateCountMatrix(attr1, attr2, numBuckets1, numBuckets2);
		}


		return cache[attr1][attr2][numBuckets1][numBuckets2][bucket1,bucket2];
	}

	private static function attributesAreInOrder(attr1 : Attribute, attr2 : Attribute) {
		if (attr2 == null) {
			return true;
		} else if (attr1 == null) {
			return false;
		} else {
			return (attr1.column_index < attr2.column_index);
		}
	}

	// Used for calculating small_cache
	private static function calculateCountArray(attr : Attribute, numBuckets : int) {

		if (!small_cache.ContainsKey(attr)) {
			small_cache[attr] = new Dictionary.<int, int[]>();
		}

		//Overwrite old data if it exists.
		small_cache[attr][numBuckets] = new int[numBuckets];

		var file = attr.file;
		for (var node in file.getNodes(true)) {
			var value = node.GetNumeric(attr);
			var bucket = attr.getBucket(value, numBuckets);
			small_cache[attr][numBuckets][bucket]++;
		}

	}

	// Used for calculating cache
	private static function calculateCountMatrix(attribute1 : Attribute, attribute2 : Attribute, numberBuckets1 : int, numberBuckets2 : int) {

		//"Sort" the attributes to avoid reflected matrices
		var inOrder = attributesAreInOrder(attribute1, attribute2);
		var attr1 = (inOrder) ? attribute1 : attribute2;
		var attr2 = (inOrder) ? attribute2 : attribute1;
		var numBuckets1 = (inOrder) ? numberBuckets1 : numberBuckets2;
		var numBuckets2 = (inOrder) ? numberBuckets2 : numberBuckets1;

		//Ensure that there is a dictionary for attr1.
		if (!cache.ContainsKey(attr1)) {
			cache[attr1] = new Dictionary.<Attribute, Dictionary.<int, Dictionary.<int, int[,] > > >();
		}

		//Ensure that there is a nested dictionary for attr2 in attr1
		if (!cache[attr1].ContainsKey(attr2)) {
			cache[attr1][attr2] = new Dictionary.<int, Dictionary.<int, int[,] > >();
		}

		//Ensure that these numbers of buckets has been made
		if (!cache[attr1][attr2].ContainsKey(numBuckets1)) {
			cache[attr1][attr2][numBuckets1] = new Dictionary.<int, int[,] >();
		}

		//Overwrite old data if it exists
		cache[attr1][attr2][numBuckets1][numBuckets2] = new int[numBuckets1,numBuckets2];


		// Loop over the nodes in the file and aggregate the counts.
		var file = attr1.file;
		for (var node in file.getNodes(true)) {
			var value1 = node.GetNumeric(attr1);
			var value2 = node.GetNumeric(attr2);
			var bucket1 = attr1.getBucket(value1, numBuckets1);
			var bucket2 = attr2.getBucket(value2, numBuckets2);
			cache[attr1][attr2][numBuckets1][numBuckets2][bucket1,bucket2]++;
		}
	}
}
