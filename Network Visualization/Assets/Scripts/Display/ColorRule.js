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

	var m_color : Color;
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

		m_color = ColorController.GenRandomColor(scheme_index); //BRIGHT
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
		Apply(true, false);
	}

	function getColor() {
		var output = Color.white;
		switch (coloring_method) {
			case COLORING_CUSTOM:
			case COLORING_CONTINUOUS_ATTR:
				output = m_color;
				break;
			case COLORING_SCHEME:
				output = ColorController.GenRandomColor(scheme_index);
				break;
			case COLORING_CENTRALITY:
				output = CentralityController.getCentralityColor(centrality_type);
				break;
		}
		return output;
	}

	// getColor() will perform operations that lead to random color results. This
	// will always return a consistent color that can be used for displaying the rule.
	function getMenuColor() {
		return m_color;
	}

	function setColor(color : Color) {
		m_color = color;
	}

	function getAdjustedVariation() {
		if (coloring_method == COLORING_CENTRALITY || (coloring_method == COLORING_SCHEME  && scheme_index == 2)){
			return 0;
		}
		return variation;
	}

	function setScheme(index : int){
		setScheme(index, true);
	}
	function setScheme(index : int, applyImmediately : boolean) {
		scheme_index = index;
		m_color = ColorController.GenRandomColor(scheme_index);
		if (applyImmediately) {
			Apply(true, false);
		}
	}

	function getScheme() {
		return scheme_index;
	}

	function setFilterMethod(index : int) {
		filter_method = index;
		Apply();
	}

	function getFilterMethod() {
		return filter_method;
	}

	//Centrality Variables
	function setCentralityType(index : int) {
		centrality_type = index;
		Apply();
	}
	function getCentralityType() {
		return centrality_type;
	}

	function toggleInvertCentrality() {
		invert_centrality = !invert_centrality;
		Apply();
	}
	function getInvertCentrality() {
		return invert_centrality;
	}

	function toggleInterCluster() {
		inter_cluster = !inter_cluster;
		Apply();
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
				return FileManager.getFileFromUUID(sourceEnumerator.Current).getDisplayName() + "";
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
	function getSources() : List.<DataFile> {
		var output : List.<DataFile> = new List.<DataFile>();
		for (source_id in sources) {
			output.Add(FileManager.getFileFromUUID(source_id));
		} 
		return output;
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
		Debug.Log(continuous_attribute.getFile().getDisplayName());
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

	function Apply() {
		Apply(true, true);
	}

	function Apply(change_color : boolean, change_size : boolean) {
		var rule_type = getFilterMethod();
		switch (filter_method) {
			case FILTER_SOURCE:
				var sources : List.<DataFile> = (isFallback())
						? FileManager.getFiles() 
						: getSources();
				for (var source in sources) {
					ApplyToCollection(source.getNodes(), change_color, change_size, true);
				}
			break;

			case FILTER_CLUSTER:
				if (isFallback()) {
					var allClusters = ClusterController.group_dict.Values;
					for (var cluster : List.<Node> in allClusters) {
						ApplyToCollection(cluster, change_color, change_size, true);
					}
				}
				else {
					for (var cluster_id in clusters) {
						var nodeSet = ClusterController.group_dict[cluster_id];	
						ApplyToCollection(nodeSet, change_color, change_size, true);
					}
				}
			break;

			case FILTER_NODE:
				if (isFallback()) {
					for (var file in FileManager.getFiles()) {
						var fileNodes = file.getNodes();
						ApplyToCollection(fileNodes, change_color, change_size, false);
					}
				}
				else {
					ApplyToCollection(nodes, change_color, change_size, false);
				}
			break;

			case FILTER_ATTRIBUTE:
				if (!attribute) {
					break;
				}
				var color = getColor();
				var attrFile : DataFile = attribute.getFile();
				var attrIndex : int = attrFile.getAttributes().IndexOf(attribute);
				for (var node in attrFile.getNodes()){
					if (node.Get(attrIndex) == attribute_value) { 
						ApplyToNode(node, color, change_color, change_size);
					}
				}
			break;
		}
	}

	private function ApplyToCollection(collection : System.Collections.IEnumerable, 
			change_color : boolean, change_size : boolean, preserveColor : boolean) {
		if (preserveColor) {
			var color = getColor();
		}
		for (var item in collection) {
			if (!preserveColor) {
				color = getColor();
			}
			var node = item as Node; //To get around the implicit cast warning
			ApplyToNode(node, color, change_color, change_size);
		}
	}

	private function ApplyToNode(node : Node, color : Color, change_color : boolean, change_size : boolean) {
		var adjustedVariation : float = getAdjustedVariation();

		//Override color in the case of coloring by centrality or continuous variable.
		if (getColoringMethod() == 2) {
			color = ColorController.GenCentralityColor(this, node);
			adjustedVariation = 0;
		} else if (getColoringMethod() == 3) {
			var continuousAttribute = this.getContinuousAttribute();
			if (continuousAttribute != null) {
				color = continuousAttribute.genFractionalColor(node);
			} else {
				color = Color.white;
			}
			adjustedVariation = 0;
		}
		
		if (change_color) {
			if (coloring_halo){
				node.setHaloColor(ColorController.NudgeColor(color, adjustedVariation));
			} 
			if (coloring_node) {
				node.setColor(ColorController.NudgeColor(color, adjustedVariation), true);
			}
		}
		if (change_size && isChangingSize()) {
			node.setSizingInfo(getSizingScale(), getSizingType(), getContinuousAttribute());
		}
	}

}