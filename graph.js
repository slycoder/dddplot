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


