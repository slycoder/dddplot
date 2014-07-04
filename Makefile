ALL_JS_FILES= d3util.js stat.js scales.js geoms.js plot.js graph.js

dddplot.js: $(ALL_JS_FILES)
	cat $^ > $@
