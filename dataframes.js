dataframe = {
	colnames: function() {
		return this._colnames;
	},
};

graph = {
	// Stored as a map from src -> dest
	edges: function() {
		return this._edges;
	},
	vertices: function() {
		return this._vertices;
	}
};

function sum(arr) {
	var result = 0.0;
	for (var i = 0; i < arr.length; ++i) {
		result += arr[i];
	}
	return result;
}

function mean(arr) {
	return sum(arr) / arr.length;
}

function variance(arr) {
	var x = 0.0;
	var x2 = 0.0;
	for (var i = 0; i < arr.length; ++i) {
		x += arr[i];
		x2 += arr[i] * arr[i];
	}
	return (x2 - x * x / arr.length) / arr.length;
}


function sapply(arr, func) {
	var result = [];
	for (var i = 0; i < arr.length; ++i) {
		result.push(
			func(arr[i])
		);
	}
	return result;
}

function randInt(a, b) {
	return Math.floor(Math.random() * (b - a)) + a;
}

function randMultinomial(weights) {
	var s = sum(weights);
	var r = Math.random();
	for (var i = 0; i < weights.length; ++i) {
		if (r < weights[i] / s) {
			return i;
		}
		r -= weights[i] / s;
	}
	return undefined;
}

function randBool(p) {
	return Math.random() < p;
}

function randGamma1(shape) {
	var v0 = Math.E / (Math.E + shape);

	while (true) {
		var v1 = Math.random();
		var v2 = Math.random();
		var v3 = Math.random();

		if (v3 <= v0) {
			var xi = Math.pow(v2, 1.0 / shape);
			var eta = Math.pow(xi, shape - 1.0) * v1;
		} else {
			var xi = 1 - Math.log(v2);
			var eta = v1 * Math.pow(-xi);
		}

		if (eta <= Math.pow(xi, shape - 1.0) * Math.exp(-xi)) {
			break;
		}
	}
	return xi;
}

function randGamma(shape, scale) {
	var xi = randGamma1(shape - Math.floor(shape));
	
	return scale * (xi - sum(
		sapply(
			replicate(Math.floor(shape), Math.random),
			Math.log
		)
	));
}

function randBeta(alpha, beta) {
	var x = randGamma(alpha, 1);
	var y = randGamma(beta, 1);
	return x / (x + y);
}

function replicate(N, func) {
	var result = [];
	for (var i = 0; i < N; ++i) {
		result.push(func());
	}
	return result;
}

function makeMatrix(m, n, func) {
	var result = [];
	for (var i = 0; i < m; ++i) {
		var tmp = [];
		for (var j = 0; j < n; ++j) {
			tmp.push(func(i, j));
		}
		result.push(tmp);
	}
	return result;
}

function stochasticBlockModel(
	N,
	K, 
	alphaDiag, 
	betaDiag, 
	alphaOffDiag, 
	betaOffDiag
) {
	var result = {};
	result.nodes = replicate(N, function() {
		return {
			size: Math.random() * 100,
			block: randInt(0, K)
		};
	});
	
	result.probs = makeMatrix(K, K,
		function(i, j) {
			if (i == j) {
				var p = randBeta(alphaDiag, betaDiag);
			} else {
				var p = randBeta(alphaOffDiag, betaOffDiag);
			}
			return p;
		});

	result.links = makeMatrix(N, N,
		function(i, j) {
			var ki = result.nodes[i].block;
			var kj = result.nodes[j].block;
			return randBool(result.probs[ki][kj]);
		});

	return result;
}

function plotDenseGraph(g, aes) {
	var nodes = sapply(
		g.nodes,
		function(n) {
			return {data: n};
		}
	);

	var links = [];
	for (var i = 0; i < g.links.length; ++i) {
		for (var j = 0; j < g.links[i].length; ++j) {
			if (i < j && g.links[i][j]) {
				links.push({source: i, target: j});
			}
		}
	}

	var dims = [500, 500];

	var force = d3.layout.force()
		.size(dims)
		.nodes(nodes)
		.links(links)
		.linkDistance(50)
		.charge(-800)
		.gravity(0.1)
		.start();

	var parent = d3.select("body").append("div")
		.attr("class", "plotregion");
	var svg = parent.append("svg");
	svg.attr("width", dims[0]).attr("height", dims[1]);

	var lines = svg.selectAll("line").data(links).enter()
		.append("line")
		.attr("stroke", "black");

	var circles = svg.selectAll("circle").data(nodes).enter()
		.append("circle")
		.attr("stroke", "black");

	if (aes.color !== undefined) {
		var values = uniqueValues(g.nodes, aes.color);
		var scale = d3.scale.ordinal()
			.domain(values)
			.range(makePalette(values.length));
		circles.attr("fill", function(d) { 
			return scale(aes.color(d.data)); 
		});
		drawLegend(parent, scale, drawColorLegend);
	}

	if (aes.size !== undefined) {
		var scale = d3.scale.linear()
			.domain(d3.extent(g.nodes, aes.size))
			.range([3, 20]);
		circles.attr("r", function(d) {
			return scale(aes.size(d.data)); 
		});
		drawLegend(parent, scale, drawSizeLegend);
	} else {
		circles.attr("r", 10)
	}

	if (aes.title !== undefined) {
		circles.append("title")
			.text(function(d) { 
				return aes.title(d.data);
			});
	}

	circles.call(force.drag);

	force.on("tick", function() {
		lines.attr("x1", function(d) { return d.source.x; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("y2", function(d) { return d.target.y; })

		circles.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; })
	});

	return force;
}

function I(d) {
	return d;
}

var g = stochasticBlockModel(25, 5, 4, 1, 1, 4);
var plot = plotDenseGraph(g, {
	color: getField("block"),
	size: getField("size"),
	title: function(d) {
		return "Value is " + d.size;
	}
});

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