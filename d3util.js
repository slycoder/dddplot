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

function filterByValue(d, dim_aes, value) {
	var result = [];
	for (var i = 0; i < d.length; ++i) {
		if (dim_aes(d[i]) === value) {
			result.push(d[i]);
		}
	}
	return result;
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

function replicate(N, func) {
	var result = [];
	for (var i = 0; i < N; ++i) {
		result.push(func());
	}
	return result;
}
