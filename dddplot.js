function getField(f) {
	return function(d) { return d[f]; };
}

function isFactor(d, dim_aes) {
	return typeof(dim_aes(d[0])) === 'string';
}

function uniqueValues(d, dim_aes) {
	var s = d3.set();
	for (var i = 0; i < d.length; ++i) {
		s.add(dim_aes(d[i]));
	}
	return s.values();
}

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
	var padding = [20, 20];
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

function dddSubPlot(parent, d, aes, geoms, options) {
	var div = parent.append("span");
	var svg = div.append("svg");
	// left, top, right, bottom
	var padding = [60, 20, 20, 45];
	var dims = [500, 300];
	svg.attr("width", dims[0]).attr("height", dims[1]);

	var xScale = axisScale(
		d, aes.x, 
		[padding[0], dims[0] - padding[2]]
	);

	var yScale = axisScale(
		d, aes.y,
		[dims[1] - padding[3], padding[1]]
	);

	aes.rawXScale = xScale;
	aes.rawYScale = yScale;
	aes.xScale = function(dd) { return xScale(aes.x(dd)); };
	aes.yScale = function(dd) { return yScale(aes.y(dd)); };

	var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
	var yAxis = d3.svg.axis().scale(yScale).orient("left");

	for (var i = 0; i < geoms.length; ++i) {
		geoms[i](svg, d, aes);
	}	

	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0," + (dims[1] - padding[3]) + ")")
		.call(xAxis);

	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(" + padding[0] + ",0)")
		.call(yAxis);

	if (options && options.xlab) {
		svg.append("text")
			.attr("x", dims[0] / 2)
			.attr("y", dims[1] - 10)
			.text(options.xlab);
	}
	if (options && options.ylab) {
		svg.append("text")
			.attr("x", 20)
			.attr("y", dims[1] / 2)
			.attr("transform", "rotate(-90, 20, " + dims[1] / 2 + ")")
			.text(options.ylab);
	}
	if (options && options.title) {
		svg.append("rect")
			.attr("x", padding[0])
			.attr("y", 0)
			.attr("width", dims[0] - padding[0])
			.attr("height", padding[1])
			.attr("fill", "grey")
			.attr("stroke", "black");

		svg.append("text")
			.attr("x", dims[0] / 2)
			.attr("y", 15)
			.attr("fill", "white")
			.text(options.title)
	}
}

function geomLine(svg, d, aes) {
	var d2 = [];
	for (var i = 0; i < d.length - 1; ++i) {
		d2.push({
			orig: d[i],
			x1: aes.xScale(d[i]),
			y1: aes.yScale(d[i]),
			x2: aes.xScale(d[i + 1]),
			y2: aes.yScale(d[i + 1])
		});
	}
	var lines = svg.selectAll("line").data(d2).enter().append("line");
	lines.attr("x1", getField("x1"))
		.attr("y1", getField("y1"))
		.attr("x2", getField("x2"))
		.attr("y2", getField("y2"));
	if (aes.colorScale !== undefined) {
		lines.attr("stroke", function(dd) {
			return aes.colorScale(dd.orig);
		});
	} else {
		lines.attr("stroke", "black");
	}
	if (aes.sizeScale !== undefined) {
		lines.attr("stroke-width", aes.sizeScale);
	} 
}

function tooltipText(elems, aes) {
	elems.append("title").text(
		function(dd) {
			return aes.x(dd) + ", " + aes.y(dd);
		}
	);
}

function geomCircle(svg, d, aes) {
	var circles = svg.selectAll("circle").data(d).enter().append("circle");
	circles.attr("cx", aes.xScale)
		.attr("cy", aes.yScale)
		.attr("stroke", "black");
	if (aes.sizeScale !== undefined) {
		circles.attr("r", aes.sizeScale);
	} else {
		circles.attr("r", 3);
	}
	if (aes.colorScale !== undefined) {
		circles.attr("fill", aes.colorScale);
	}
	circles.append("title").text(
		function(dd) {
			return aes.x(dd) + ", " + aes.y(dd);
		}
	);
	tooltipText(circles, aes);
}

function geomBar(svg, d, aes) {
	var bar = svg.selectAll("rect").data(d).enter().append("rect");
	// TODO: Compute bar widths more smartly.
	var zero = aes.rawYScale(0);
	bar.attr("x", aes.xScale)
		.attr("y", aes.yScale)
		.attr("width", 10)
		.attr("height", function(dd) {
			return zero - aes.yScale(dd);
		})
		.attr("stroke", "black");
	if (aes.colorScale !== undefined) {
		bar.attr("fill", aes.colorScale);
	}
	tooltipText(bar, aes);
}

function filterByValue(d, dim_aes, value) {
	var result = [];
	for (var i = 0; i < d.length; ++i) {
		if (dim_aes(d[i]) === value) {
			result.push(d[i]);
		}
	}
	return result;
}

function dddplot(d, aes, geoms, options) {
	var scaleInfo = {};

	if (aes.color !== undefined) {
		var colorScale;
		var colorScaleValue;
		if (isFactor(d, aes.color)) {
			var values = uniqueValues(d, aes.color);
			colorScale = d3.scale.ordinal()
				.domain(values)
				.range(makePalette(values.length));
			colorScaleValue = colorScale;		
		} else {
			colorScaleValue = d3.scale.linear()
				.domain(d3.extent(d, aes.color))
				.range([0, 255]);
			colorScale = continuousColorScale(colorScaleValue);
		}
		aes.colorScale = function(dd) { return colorScale(aes.color(dd)); };
		scaleInfo.colorScaleValue = colorScaleValue;
	}

	if (aes.size !== undefined) {
		var sizeScale = d3.scale.linear()
			.domain(d3.extent(d, aes.size))
			.range([0, 15]);
		aes.sizeScale = function(dd) { return sizeScale(aes.size(dd)); };
		scaleInfo.sizeScale = sizeScale;
	}
	
	if (aes.facet !== undefined) {
		var facetParent = d3.select("body")
			.append("table")
			.attr("class", "facetregion")
			.append("tr");
		var parent = facetParent.append("td")
			.attr("class", "subplotregion");
		var legendParent = facetParent.append("td");

		var values = uniqueValues(d, aes.facet);
		for (var i = 0; i < values.length; ++i) {
			if (!options) {
				options = {};
			}
			options.title = values[i];
			dddSubPlot(
				parent,
				filterByValue(d, aes.facet, values[i]),
				aes,
				geoms,
				options
			);
		}
	} else {
		var parent = d3.select("body").append("div")
			.attr("class", "facetregion");
		var legendParent = parent;
		dddSubPlot(parent, d, aes, geoms, options);
	}
	
	if (scaleInfo.colorScaleValue !== undefined) {
		drawLegend(legendParent, scaleInfo.colorScaleValue, drawColorLegend);
	}

	if (scaleInfo.sizeScale !== undefined) {
		drawLegend(legendParent, scaleInfo.sizeScale, drawSizeLegend);
	}

}


// Test area
function genData(n) {
	var x = [];
	for (var i = 0; i < n; ++i) {
		x.push([
			i, 
			5 * i + Math.random() * 30, 
			i / 10 + Math.random() * 10,
			['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
		])
	}
	return x;
}

var data = genData(30);
var myAes = {
	y: getField(1),
	x: getField(0)
};
var myOptions = {
	xlab: "my x label",
	ylab: "my y label",
	title: "some title"
}
dddplot(data, myAes, [geomCircle], myOptions);
dddplot(data, myAes, [geomLine], myOptions);

myAes.color = getField(2);
dddplot(data, myAes, [geomCircle]);
dddplot(data, myAes, [geomLine]);
dddplot(data, myAes, [geomLine, geomCircle]);

myAes.size = getField(2);
dddplot(data, myAes, [geomCircle]);

myAes.color = getField(3);
dddplot(data, myAes, [geomCircle]);

dddplot(data, myAes, [geomBar]);

myAes.facet = getField(3);
dddplot(data, myAes, [geomCircle])

myAes.facet = undefined;
myAes.x = getField(3);
dddplot(data, myAes, [geomCircle]);