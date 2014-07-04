// Just a utility function
function CONST(val) {
	return function() {
		return val;
	};
}

// Documents
function Document(words) {
	this.words = words;
}

Document.prototype.getNumWords = function() {
	return this.words.length;
}

Document.prototype.getWord = function(i) {
	return this.words[i];
}

Document.prototype.prune = function(vocab) {
	var newWords = [];
	for (var i = 0; i < this.words.length; ++i) {
		if (vocab.has(this.words[i])) {
			newWords.push(this.words[i]);
		}
	}
	this.words = newWords;
}

// Corpora
function Corpus(documents) {
	this.documents = documents;
}

Corpus.prototype.getNumDocuments = function() {
	return this.documents.length;
}

Corpus.prototype.getDocument = function(i) {
	return this.documents[i];
}

Corpus.prototype.addDocument = function(doc) {
	this.documents.push(doc);
}

Corpus.prototype.getVocab = function() {
	return this.vocab;
}

Corpus.prototype.prune = function(minCount, maxCount) {
	var vocab = d3.map();
	for (var d = 0; d < this.getNumDocuments(); ++d) {
		var doc = this.getDocument(d);
		for (var i = 0; i < doc.getNumWords(); ++i) {
			var w = doc.getWord(i);
			vocab.set(w, (vocab.get(w) || 0) + 1);
		}
	}

	this.vocab = d3.map();
	var words = vocab.keys();
	for (var i = 0; i < words.length; ++i) {
		if (vocab.get(words[i]) >= minCount &&
			vocab.get(words[i]) <= maxCount) {
			this.vocab.set(words[i], vocab.get(words[i]));
		}
	}

	for (var d = 0; d < this.getNumDocuments(); ++d) {
		this.getDocument(d).prune(this.vocab);
	}	
}

// The model itself
function LDAModel(corpus, K, alpha, beta) {
	this.corpus = corpus;
	this.K = K;
	this.alpha = alpha;
	this.beta = beta;

	this.topicSums = replicate(K, CONST(0));
	this.documentSums = replicate(
		corpus.getNumDocuments(),
		function() {
			return replicate(K, CONST(0));
		}
	);
	this.topics = d3.map();
	this.assignments = [];
	for (var d = 0; d < corpus.getNumDocuments(); ++d) {
		var doc = corpus.getDocument(d);
		this.assignments.push(
			replicate(doc.getNumWords(), CONST(-1))
		);
		for (var i = 0; i < doc.getNumWords(); ++i) {
			var k = randInt(0, K);
			var w = doc.getWord(i);
			if (!this.topics.has(w)) {
				this.topics.set(w, replicate(K, CONST(0)));
			}
			this.assign(d, i, w, k, 1);
		}
	}
	this.vocabSize = this.corpus.getVocab().size();
}

LDAModel.prototype.getVocabSize = function() {
	return this.vocabSize;
}

LDAModel.prototype.assign = function(d, i, w, k, val) {
	this.documentSums[d][k] += val;
	this.topicSums[k] += val;
	var curTopic = this.topics.get(w);
	curTopic[k] += val;
	this.assignments[d][i] = k;
}

LDAModel.prototype.getAssignment = function(d, i) {
	return this.assignments[d][i];
}

LDAModel.prototype.iterateDocument = function(d) {
	var tmp = replicate(this.K, CONST(0.0));
	var doc = this.corpus.getDocument(d);
	for (var i = 0; i < doc.getNumWords(); ++i) {
		var w = doc.getWord(i);
		var oldK = this.getAssignment(d, i);
		this.assign(d, i, w, oldK, -1);
		for (var k = 0; k < this.K; ++k) {
			tmp[k] = this.documentSums[d][k] + this.alpha;
			tmp[k] *= this.topics.get(w)[k] + this.beta;
			tmp[k] /= this.topicSums[k] + this.getVocabSize() * this.beta;
		}
		var k = randMultinomial(tmp);
		this.assign(d, i, w, k, 1);
	}
}

LDAModel.prototype.iterate = function() {
	for (var d = 0; d < this.corpus.getNumDocuments(); ++d) {
		this.iterateDocument(d);
	}
}

LDAModel.prototype.getTopWords = function(numWords) {
	var result = [];
	// scoping clowniness
	var topics = this.topics;
	for (var k = 0; k < this.K; ++k) {
		var topicWords = this.topics.keys();
		topicWords.sort(
			function(a, b) {
				return d3.descending(
					topics.get(a)[k],
					topics.get(b)[k]
				);
			}
		);
		result.push(topicWords.slice(0, numWords));
	}
	return result;
}

var allReviews = new Corpus([]);
var model;
d3.text("positive.review", function(error, text) {
	var reviews = text.split("\n");
	for (var i = 0; i < reviews.length; ++i) {
		allReviews.addDocument(
			new Document(
				reviews[i].replace(/:\d/g, "").split(" ")
			)
		);
	}
	allReviews.prune(4, 100);
	model = new LDAModel(allReviews, 10, 0.1, 0.1);

	window.setTimeout("iterateModel()", 5000);
});

function iterateModel() {
	model.iterate();
	var topWords = model.getTopWords(10);
	var elem = document.getElementById("topicregion");

	var innerhtml = "";
	for (var i = 0; i < topWords.length; ++i) {
		innerhtml += "<div class=\"singletopic\">"
		for (var j = 0; j < topWords[i].length; ++j) {
			innerhtml += "<p>" + topWords[i][j] + "</p>";
		}
		innerhtml += "</div>"
	}
	elem.innerHTML = innerhtml;

	// window.setTimeout("iterateModel()", 5000);
}