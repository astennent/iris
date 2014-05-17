#pragma strict

// This class is responsible for abstracting away instance counts of nodes matching a certain range in 2 or more attributes
// and then caching the results for reuse between repeated calls and different graphing methods.
class CountCache {

	// Used for single attribute counts
	// attribute -> numBuckets -> countArray
	private static var small_cache = new Dictionary.<Attribute, Dictionary.<int, int[]> >();
	private static var small_max_cache = new Dictionary.<Attribute, Dictionary.<int, int> >();

	// Used for double attribute counts
	// attribute -> attribute -> numBuckets -> numBuckets -> countMatrix
	private static var cache = new Dictionary.<Attribute, Dictionary.<Attribute, Dictionary.<int, Dictionary.<int, int[,] > > > >();
	private static var max_cache = new Dictionary.<Attribute, Dictionary.<Attribute, Dictionary.<int, Dictionary.<int, int > > > >();

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

	private static function getCount(attr : Attribute, numBuckets : int, bucket : int) {
		return getCount(attr, null, numBuckets, 0, bucket, 0);
	}

	// Returns the number of matching nodes with the specified coordinates
	static function getCount(attribute1 : Attribute, attribute2 : Attribute, numBuckets1 : int, numBuckets2 : int, bucket1 : int, bucket2 : int) : int{
		
		//"Sort" the attributes to avoid reflected matrices
		var attr1 = chooseAttribute(attribute1, attribute2, true);
		var attr2 = chooseAttribute(attribute1, attribute2, false);
	
		// attr1 is only null if both are null. Exit immediately.
		if (attr1 == null) {
			return 0;
		} 

		// only attr2 is null, so use the small cache.
		if (attr2 == null) {

			if (!small_cache.ContainsKey(attr1) || !small_cache[attr1].ContainsKey(numBuckets1)) {
				calculateCountArray(attr1, numBuckets1);
			}
			Debug.Log(attr1 + " " + attr2 + " " + numBuckets1 + " " + numBuckets2);
			return small_cache[attr1][numBuckets1][bucket1];
		}
		
		//Calculate if the values are unknown
		if (!cache.ContainsKey(attr1) || !cache[attr1].ContainsKey(attr2) || !cache[attr1][attr2].ContainsKey(numBuckets1) ||
				!cache[attr1][attr2][numBuckets1].ContainsKey(numBuckets2)) {
			calculateCountMatrix(attr1, attr2, numBuckets1, numBuckets2);
		}


		return cache[attr1][attr2][numBuckets1][numBuckets2][bucket1,bucket2];
	}

	// static function getMaxCount(attribute1 : Attribute, attribute2 : Attribute, numBuckets1 : int, numBuckets2 : int) : int {
	// 	//"Sort" the attributes to avoid reflected matrices
	// 	var attr1 = chooseAttribute(attribute1, attribute2, true);
	// 	var attr2 = chooseAttribute(attribute1, attribute2, false);

	// 	if (attr1 == null) {
	// 		return 0;
	// 	}

	// 	// only attr2 is null, so use the small cache.
	// 	if (attr2 == null) {
	// 		if (!small_max_cache.ContainsKey(attr1) || !small_max_cache[attr1].ContainsKey(numBuckets1)) {
	// 			calculateMaxCount(attr1, numBuckets1);
	// 		}
	// 		print(small_max_cache[attr1][numBuckets1] + " " + )
	// 		return small_max_cache[attr1][numBuckets1];
	// 	}

	// 	//Calculate if the values are unknown
	// 	if (!max_cache.ContainsKey(attr1) || !max_cache[attr1].ContainsKey(attr2) || !max_cache[attr1][attr2].ContainsKey(numBuckets1) ||
	// 			!max_cache[attr1][attr2][numBuckets1].ContainsKey(numBuckets2)) {
	// 		calculateMaxCount(attr1, attr2, numBuckets1, numBuckets2);
	// 	}

	// 	return max_cache[attr1][attr2][numBuckets1][numBuckets2];
	// }

	private static function chooseAttribute(attr1 : Attribute, attr2 : Attribute, first : boolean) {
		
		//if both are null return null. 
		if (attr1 == null && attr2 ==null) {
			return null;
		}

		if (attr1 != null && attr2 == null) {
			return (first) ? attr1 : attr2;
		}

		if (attr1 == null && attr2 != null) {
			return (first) ? attr2 : attr1;
		}

		return ( (first && attr1.column_index < attr2.column_index) ||  (!first && attr1.column_index > attr2.column_index)) ? attr1 : attr2;
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
	private static function calculateCountMatrix(attribute1 : Attribute, attribute2 : Attribute, numBuckets1 : int, numBuckets2 : int) {

		//"Sort" the attributes to avoid reflected matrices
		var attr1 = chooseAttribute(attribute1, attribute2, true);
		var attr2 = chooseAttribute(attribute1, attribute2, false);

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


	// // Used for calculating small_max_cache
	// private static function calculateMaxCount(attr : Attribute, numBuckets : int) {
	// 	if (!small_max_cache.ContainsKey(attr)) {
	// 		small_max_cache[attr] = new Dictionary.<int, int>();
	// 	}

	// 	var max = 0;
	// 	for (var bucket = 0 ; bucket < numBuckets ; bucket++) {
	// 		var cur_count = getCount(attr, numBuckets, bucket);
	// 		max = Mathf.Max(cur_count, max);
	// 	}

	// 	small_max_cache[attr][numBuckets] = max;
	// }

	// // Used for calculating max_cache
	// private static function calculateMaxCount(attribute1 : Attribute, attribute2 : Attribute, numBuckets1 : int, numBuckets2 : int) {
	// 	//"Sort" the attributes to avoid reflected matrices
	// 	var attr1 = chooseAttribute(attribute1, attribute2, true);
	// 	var attr2 = chooseAttribute(attribute1, attribute2, false);

	// 	//Ensure that there is a dictionary for attr1.
	// 	if (!max_cache.ContainsKey(attr1)) {
	// 		max_cache[attr1] = new Dictionary.<Attribute, Dictionary.<int, Dictionary.<int, int > > >();
	// 	}

	// 	//Ensure that there is a nested dictionary for attr2 in attr1
	// 	if (!max_cache[attr1].ContainsKey(attr2)) {
	// 		max_cache[attr1][attr2] = new Dictionary.<int, Dictionary.<int, int > >();
	// 	}

	// 	//Ensure that these numbers of buckets has been made
	// 	if (!max_cache[attr1][attr2].ContainsKey(numBuckets1)) {
	// 		max_cache[attr1][attr2][numBuckets1] = new Dictionary.<int, int>();
	// 	}


	// 	var max = 0;
	// 	for (var bucket1 = 0 ; bucket1 < numBuckets1 ; bucket1++) {
	// 		for (var bucket2 = 0 ; bucket2 < numBuckets2 ; bucket2++) {
	// 			var cur_count = getCount(attr1, attr2, numBuckets1, numBuckets2, bucket1, bucket2);
	// 			max = Mathf.Max(cur_count, max);
	// 		}
	// 	}

	// 	max_cache[attr1][attr2][numBuckets1][numBuckets2] = max;
	// }





}
