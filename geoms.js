// Utility functions used by multiple geoms.
function tooltipText(elems, aes) {
	elems.append("title").text(
		function(dd) {
			return aes.x(dd) + ", " + aes.y(dd);
		}
	);
}

// Here begin the geoms:
// * line
// * point
// * bar
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

