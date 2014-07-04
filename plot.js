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
