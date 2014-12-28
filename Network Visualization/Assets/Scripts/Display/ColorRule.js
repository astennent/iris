#pragma strict

import System.Xml;
import System.Xml.Serialization;
import System.Xml.Schema.XmlAtomicValue;

@XmlRoot("ColorRule")
class ColorRule {

	//Determines what changes to the node size should be applied.
	static var sizing_types = [" By Edges", " Fixed", " By Attribute"];
	static var SIZING_EDGES = 0;
	static var SIZING_FIXED = 1;
	static var SIZING_ATTRIBUTE = 2;
	var sizing_type = SIZING_EDGES;

	private var changing_size = false;
	var sizing_scale : float = 2.5;


	//Determines which nodes to apply a rule to.
	static var filter_methods = ["Source", "Cluster", "Node", "Attribute"];
	static var FILTER_SOURCE = 0;
	static var FILTER_CLUSTER = 1;
	static var FILTER_NODE = 2;
	static var FILTER_ATTRIBUTE = 3;
	var filter_method = FILTER_SOURCE;

	var sources : HashSet.<int> = new HashSet.<int>();  //Which data sources does this rule apply to?
	var clusters : HashSet.<int> = new HashSet.<int>(); //Which cluster does this rule apply to?
	private var nodes : HashSet.<Node> = new HashSet.<Node>(); //Which nodes does this rule apply to?

	//Determines the method by which the rule selects a color for the node.
	static var coloring_methods = [" Custom Color", " Scheme", " Centrality", " Continuous Attribute"];
	static var COLORING_CUSTOM = 0;
	static var COLORING_SCHEME = 1;
	static var COLORING_CENTRALITY = 2;
	static var COLORING_CONTINUOUS_ATTR = 3;
	var coloring_method = COLORING_SCHEME;	

	var color : Color;
	var variation : float;
	var scheme_index : int;
	var centrality_type : int; //corresponds to ColorController.centrality_types
	var inter_cluster : boolean; //used for specifying whether the centrality should be relative to everything or just the group.
	var invert_centrality : boolean; //swap colors?
	private var attribute : Attribute; //stores which attribute you're looking at
	var attribute_uuid : int;
	var attribute_value : String = "";
	private var continuous_attribute : Attribute;
	var continuous_attribute_uuid : int;
	
	var coloring_node = true;  //Should it color the body of the node?
	var coloring_halo = true; //Should it color the halo?

	var uuid : int;

	function ColorRule() {
		centrality_type = 1; //CLOSENESS

		coloring_node = coloring_halo = true;

		color = ColorController.GenRandomColor(scheme_index); //BRIGHT
		setScheme(0, false);  //bright
		variation = 0.3;

		uuid = WorkspaceManager.generateUUID();
	}

	function isFallback() {
		return (this == ColorController.rules[0]);
	}

	function getColoringMethod() {
		return coloring_method;
	}

	function setColoringMethod(m : int) {
		coloring_method = m;
		ColorController.ApplyRule(this, true, false);
	}

	function getColor(){
		if (coloring_method == COLORING_CUSTOM) {
			return color;
		} else if (coloring_method == COLORING_SCHEME) {
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
		if (applyImmediately) {
			ColorController.ApplyRule(this, true, false);
		}
	}

	function getScheme() {
		return scheme_index;
	}

	function setFilterMethod(index : int) {
		filter_method = index;
		ColorController.ApplyRule(this);
	}

	function getFilterMethod() {
		return filter_method;
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
		if (filter_method == FILTER_SOURCE){
			var count = sources.Count;
			if (count == 0) {
				return "New Source Rule";
			} else if (count == 1) {
				var sourceEnumerator = sources.GetEnumerator();
				sourceEnumerator.MoveNext();
				return FileManager.getFileFromUUID(sourceEnumerator.Current).shortName() + "";
			} else {
				return sources.Count + " sources";
			}
		} else if (filter_method == FILTER_CLUSTER){
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
		} else if (filter_method == FILTER_NODE) {
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
		} else if (filter_method == FILTER_ATTRIBUTE) {
			if (attribute == null) {
				return "New Attribute Rule";
			} else {
				return attribute.getColumnName() + ": " + attribute_value;
			}
		}

		return "New Rule";
	}

	//Sources
	function usesSource(input : int){
		return sources.Contains(input);
	}
	function getSources(){
		return sources;
	}
	function toggleSource(input : int) {
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
	function setAttribute(attribute : Attribute) {
		this.attribute = attribute;
	}
	function getAttributeValue(){
		return attribute_value;
	}
	function setAttributeValue(attribute_value : String) {
		this.attribute_value = attribute_value;
	}
	

	function getContinuousAttribute() {
		return continuous_attribute;
	}

	function setContinuousAttribute(continuous_attribute : Attribute) {
		this.continuous_attribute = continuous_attribute;

		sources = new HashSet.<int>();
		//Automatically switch to coloring the file of the selected attribute.
		sources.Clear();
		sources.Add(continuous_attribute.getFile().uuid); 
		this.setFilterMethod(FILTER_SOURCE); 
	}


	/* ******** Node Sizing ********** */


	function isChangingSize() {
		return changing_size;
	}

	function setChangingSize(changing_size : boolean) {
		this.changing_size = changing_size;
	}

	function getSizingType() {
		return sizing_type;
	}

	function setSizingType(sizing_type : int) {
		this.sizing_type = sizing_type;
	}

	function getSizingScale() {
		return sizing_scale;
	}

	function setSizingScale(sizing_scale : float) {
		this.sizing_scale = sizing_scale;
	}

	function OnWorkspaceLoad() {
		continuous_attribute = FileManager.getAttributeFromUUID(continuous_attribute_uuid);
		attribute = FileManager.getAttributeFromUUID(attribute_uuid);
		//Apply rule?
	}

}