#pragma strict

class ColorRule {

	private var rule_type : int;

	private var centrality_type : int; //corresponds to ColorController.centrality_types
	private var inter_cluster : boolean; //used for specifying whether the centrality should be relative to everything or just the group.
	private var invert_centrality : boolean; //swap colors?

	private var sources : HashSet.<DataFile> = new HashSet.<DataFile>(); //stores name of source
	private var clusters : HashSet.<int> = new HashSet.<int>(); //stores id of cluster

	private var nodes : HashSet.<Node> = new HashSet.<Node>();;

	private var attribute : Attribute; //stores which attribute you're looking at
	private var attribute_value : String = "";

	private var continuous_attribute : Attribute;

	var is_fallback : boolean; //is this the "default" rule?

	var color : Color;
	var variation : float;

	var coloring_halo : boolean; //Should it color the halo?
	var coloring_node : boolean;  //Should it color the body of the node?

	var scheme_button_color : Color; //used for coloring the scheme button so it doesn't flash.

	var uses_manual_size = false;
	var manual_size : float = 2.5;

	//0:custom, 1:scheme, 2:centrality
	private var method : int = 0;
	private var scheme_index : int;

	function ColorRule() {
		rule_type = 2; //NODE
		centrality_type = 1; //CLOSENESS

		coloring_node = coloring_halo = true;

		color = ColorController.GenRandomColor(scheme_index); //BRIGHT
		setScheme(0, false);  //bright
		variation = 0.3;
	}

	function getMethod() {
		return method;
	}

	function setMethod(m : int) {
		method = m;
		ColorController.ApplyRule(this, true, false);
	}

	function getColor(){
		if (method == 0) {
			return color;
		} else if (method == 1) {
			return ColorController.GenRandomColor(scheme_index);
		} else {
			if (centrality_type == 0) {
				return new Color(1, .5, .5);
			} else if (centrality_type == 1) {
				return new Color(1, 1, .5);
			} else if (centrality_type == 2) {
				return new Color(.5, 1, .5);
			} else {
				return new Color(.5, 1, 1);
			}
		}
	}


	function setScheme(index : int){
		setScheme(index, true);
	}
	function setScheme(index : int, applyImmediately : boolean) {
		scheme_index = index;
		color = ColorController.GenRandomColor(scheme_index);
		scheme_button_color = color;
		scheme_button_color.a = 1;
		if (applyImmediately) {
			ColorController.ApplyRule(this, true, false);
		}
	}

	function getScheme() {
		return scheme_index;
	}

	function setRuleType(index : int) {
		rule_type = index;
		ColorController.ApplyRule(this);
	}

	function getRuleType() {
		return rule_type;
	}


	//Centrality Variables
	function setCentralityType(index : int) {
		centrality_type = index;
		ColorController.ApplyRule(this);
	}
	function getCentralityType() {
		return centrality_type;
	}

	function toggleInvertCentrality() {
		invert_centrality = !invert_centrality;
		ColorController.ApplyRule(this);
	}
	function getInvertCentrality() {
		return invert_centrality;
	}

	function toggleInterCluster() {
		inter_cluster = !inter_cluster;
		ColorController.ApplyRule(this);
	}
	function getInterCluster() {
		return inter_cluster;
	}

	function getDisplayName() : String {
		if (rule_type == 0){ //SOURCE
			var count = sources.Count;
			if (count == 0) {
				return "New Source Rule";
			} else if (count == 1) {
				var sourceEnumerator = sources.GetEnumerator();
				sourceEnumerator.MoveNext();
				return sourceEnumerator.Current.shortName() + "";
			} else {
				return sources.Count + " sources";
			}
		} else if (rule_type == 1){
			count = clusters.Count;
			if (count == 0){
				return "New Cluster Rule";
			} else if (count == 1) {
				var clusterEnumerator = clusters.GetEnumerator();
				clusterEnumerator.MoveNext();
				return "Cluster " + sourceEnumerator.Current;
			} else {
				return clusters.Count + " clusters";
			}
		} else if (rule_type == 2) {
			count = nodes.Count;
			if (count == 0){
				return "New Node Rule";
			} else if (count == 1) {
				var nodeEnumerator = nodes.GetEnumerator();
				nodeEnumerator.MoveNext();
				return nodeEnumerator.Current.getDisplayName() + "";
			} else {
				return nodes.Count + " nodes";
			}
		} else if (rule_type == 3) {
			if (attribute == null) {
				return "New Attribute Rule";
			} else {
				return attribute.getColumnName() + ": " + attribute_value;
			}
		}

		return "New Rule";
	}

	//Sources
	function usesSource(input : DataFile){
		return sources.Contains(input);
	}
	function getSources(){
		return sources;
	}
	function toggleSource(input : DataFile) {
		if (usesSource(input)) {
			sources.Remove(input);
		} else {
			sources.Add(input);
		}
	}

	//Clusters
	function usesCluster(input : int) {
		return clusters.Contains(input);
	}
	function toggleCluster(input : int) {
		if (usesCluster(input)) {
			clusters.Remove(input);
		} else {
			clusters.Add(input);
		}
	}
	function getClusters() {
		return clusters;
	}

	//Nodes
	function usesNode(input : Node) {
		return nodes.Contains(input);
	}
	function toggleNode(input : Node) {
		if (usesNode(input)) {
			nodes.Remove(input);
		} else {
			nodes.Add(input);
		}
	}
	function getNodes() {
		return nodes;
	}

	//Attributes
	function getAttribute(){
		return attribute;
	}
	function setAttribute(input : Attribute){
		attribute = input;
	}
	function getAttributeValue(){
		return attribute_value;
	}
	function setAttributeValue(input : String) {
		attribute_value = input;
	}
	

	function getContinuousAttribute() {
		return continuous_attribute;
	}

	function setContinuousAttribute(input : Attribute) {
		this.continuous_attribute = input;

		//Automatically switch to coloring the file of the selected attribute.
		sources = new HashSet.<DataFile>();
		sources.Add(input.file); 
		this.setRuleType(0); //switch to coloring by source
	}
}