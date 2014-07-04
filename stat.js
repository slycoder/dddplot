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
