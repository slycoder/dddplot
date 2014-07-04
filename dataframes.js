dataframe = {
	colnames: function() {
		return this._colnames;
	},
};

graph = {
	edges: function() {
		return this._edges;
	},
	vertices: function() {
		return this._vertices;
	}
};

// TODO:
// Implement general mixture model


// In progress:
// Implement bsp pagerank
function bsp(graph, bspFunc) {
	var vertexData = sapply(
		graph.nodes,
		bspFunc.newVertexData
	);
}

bsp(g, {
	newVertexData: function(d) {
		return 0.0;
	},
	runSuperstep: function(d, edges, messages, step, context) {
		if (step > 0) {
			var s = sum(messages);
			d.data = 0.15 / context.numVertices + 0.85 * s;
		}
		sapply(edges, function(e) {
			return {target: e.target, value: d.data};
		});
	}
});
