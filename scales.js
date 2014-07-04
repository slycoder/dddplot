function makePalette(n) {
	var result = [];
	for (var i = 0; i < n; i++) {
		result.push(
			d3.hsl(360 * i / n, 0.7, 0.8).toString()
		);
	}
	return result;
}

function axisScale(d, dim_aes, range) {
	if (!isFactor(d, dim_aes)) {
		var scale = d3.scale.linear()
			.domain(d3.extent(d, dim_aes))
			.range(range)
			.nice();
		return scale;
	} else {
		var values = uniqueValues(d, dim_aes);
		var scale = d3.scale.ordinal()
			.domain(values)
			.rangePoints(range, 1.0);
		return scale;
	}
}

function continuousColorScale(scale) {
	return function(dd) {
		var v = Math.round(scale(dd));
		return d3.rgb(v, v, 255).toString();
	};
}

function drawColorLegend(groups, scale, legendScale, x) {
	var colorizedScale = scale;
	if (scale.ticks !== undefined) {
		colorizedScale = continuousColorScale(scale);
	}
	groups.append("rect")
		.attr("x", x - 10)
		.attr("y", function(dd) {
			return legendScale(dd) - 10;
		})
		.attr("width", 20)
		.attr("height", 20)
		.attr("stroke", "black")
		.attr("fill", colorizedScale);
}

function drawLegend(div, scale, drawer) {
	var ticks;
	if (scale.ticks !== undefined) {
		ticks = scale.ticks(5);
	} else {
		ticks = scale.domain();
	}
	var svg = div.append("span")
		.attr("class", "legendregion")
		.append("svg");
	var dims = [90, 28 * ticks.length + 40];
	var padding = [30, 20];
	svg.attr("width", dims[0]).attr("height", dims[1]);
	var groups = svg.selectAll("g")
		.data(ticks).enter().append("g");
	var legendScale = d3.scale.ordinal()
		.domain(ticks)
		.rangePoints([padding[1], dims[1] - padding[1]], 1.0);

	drawer(groups, scale, legendScale, dims[0] / 2);

	var axis = d3.svg.axis().scale(legendScale).orient("left");

	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(" + padding[0] + ",0)")
		.call(axis);
}

function drawSizeLegend(groups, scale, legendScale, x) {
	groups.append("circle")
		.attr("cx", x)
		.attr("cy", legendScale)
		.attr("r", scale);
}



