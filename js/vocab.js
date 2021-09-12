
// Possible states: "start" (no words shown), "word" (a word is shown), "definition" (the definition is shown)
var state = "start";
var currentWord;
var currentIndex;
var totalDeletions = 0;
var progressBar = "visible";
var words;
var audio;

/* Initialization function: */
$(document).ready(function(){

	// Loads data:
	jQuery.get({ url: 'json/vocab.json', cache: false }).done(function (data) {

		// Saves json data:
		words = data;

        // Obtains URL parameters:
        let totalNumWords = obtainTotalFromURL();
        // If total number of words was specified, filters only the most recent totalNumWords:
        if (totalNumWords != null) {
            words = words.slice(words.length-totalNumWords,words.length)
        }

		// Initializes progress bar:
		updateProgressBar();

		// Allows the simulation to start:
		$(document).on('click touch', handleTouch);

		// Adds a swipe event (to stop a word from showing up again):
		$(document).on('swipe', handleSwipe);

		// Adds an event to toggle the progress bar:
		$(document).on('taphold', toggleProgressBar);

		// Removes JQuery mobile loading message:
		$.mobile.loading().hide();

		// To prevent tap+swipe, we remove bindings on swipe and readd them on mouseup:
		$(document).on("mouseup", handleMouseUp)

	});

});


function handleMouseUp(){
	// Make sure no bindings exist:
	$(document).unbind();
	// Rebinds events:
	$(document).on('click touch', handleTouch);
	$(document).on('swipe', handleSwipe);
	$(document).on('taphold', toggleProgressBar);
	$(document).on('mouseup', handleMouseUp);
}

// Upon swiping during a word, the current word will not be shown again in the future (removes from selection array):
function handleSwipe() {
	// Adds a visual swipe effect:
	$(".wrapper").animate(
		{
			"margin-left" : "44vw",
			"opacity": 0
		},
		{
			"duration" : 100,
			"complete" : swipeComplete
	  	}
	);
}

// Function to be called once the swipe animation is over:
function swipeComplete(){
	// Deletes current wrapper:
	$(".wrapper").remove();
	// Creates new wrapper:
	$(".center").append( $("<div></div>").addClass("wrapper") );
	// Checks if a word is being displayed:
	if (state != "start"){
		// Removes it from the selection array:
		var removed = words.splice(currentIndex, 1);
		totalDeletions += 1;
		// Visually updates progress bar:
		updateProgressBar();
		// Generates a new word:
		state = "start";
		handleTouch();
	}
}


function handleTouch() {
	// Checks if no words are being displayed:
	if ((state == "start") || (state == "definition")){
		// Samples a word:
		currentIndex = Math.floor( Math.random() * (words.length) );
		currentWord = words[currentIndex];
		createWord();
		state = "word";
	} else if (state == "word"){
		createDefinition();
		state = "definition";
	}

}

function toggleProgressBar() {
	let duration = 400;
	if (progressBar == "visible"){
		// Hides progress bar:
		$(".progress-wrapper").animate(
			{ "margin-top" : "-4vh",
			  "duration" : duration
		  	}
		)
		$(".progress-text").animate(
			{ "top" : "-3.8vh",
			  "duration" : duration
		  	}
		)
		progressBar = "hidden"
	} else if (progressBar == "hidden") {
		// Displays progress bar:
		$(".progress-wrapper").animate(
			{ "margin-top" : "3vh",
			  "duration" : duration
		  	}
		)
		$(".progress-text").animate(
			{ "top" : "3.2vh",
			  "duration" : duration
		  	}
		)
		progressBar = "visible"
	}

}

// Updates progress bar content:
function updateProgressBar() {
	let percentage = 100 * (totalDeletions / (words.length + totalDeletions));
	$(".progress").css("width", percentage + "%");
	$(".progress-text").text( totalDeletions + "/" + (words.length + totalDeletions) )
}

function createWord(){
	// Clears current DOM:
	$(".wrapper").empty();
	// Creates word:
	let h1 = $("<h1></h1>").text(currentWord.word);
	// Appends to the DOM:
	$(".wrapper").append(h1)
	// Plays sound:
	if (audio) audio.pause();
	let audioName;
	currentWord.audio ? audioName = currentWord.audio : audioName = currentWord.word;
	audio = new Audio("pronunciation/vocab/" + audioName + ".mp3");
	audio.play();
}

function createDefinition(){

	// Case where there's just one meaning:
	if (typeof currentWord.meaning == "string") {
		$(".wrapper").append( $("<h2></h2>").text(punctuate(capitalize(currentWord.meaning))) );
	// Case where there are multiple meanings:
	} else if (Array.isArray(currentWord.meaning)) {
		currentWord.meaning.forEach((meaning, index) => {
			$(".wrapper").append( $("<h2></h2>").text(index+1 + ". " + punctuate(capitalize(meaning))) );
		});
	}

	// Checks if example phrase exists:
	if (currentWord.phrase != undefined) {
		// Case where there's just one example phrase:
		if (typeof currentWord.phrase == "string") {
			$(".wrapper").append( $("<h3></h3>").text("\"" + capitalize(currentWord.phrase) + "\"") );
		// Case where there are multiple phrases:
		} else if (Array.isArray(currentWord.phrase)) {
			currentWord.phrase.forEach(phrase => {
				$(".wrapper").append( $("<h3></h3>").text("\"" + capitalize(phrase) + "\"") );
			});
		}
	}

	// Play example phrase:
	if (audio) audio.pause();
	let audioName;
	currentWord.audio ? audioName = currentWord.audio : audioName = currentWord.word;
	audio = new Audio("pronunciation/vocab/" + audioName + "2.mp3");
	$(audio).on("canplay", () => audio.play() )
}

function obtainTotalFromURL(){
	// Captures URL parameters:
	let urlParams = new URLSearchParams(window.location.search);
	// Returns total number of words:
	return urlParams.get("total");
}

function capitalize(s){
	// Checks if s is really a string:
	if (typeof s !== 'string') return ""
	// Capitalize:
	return s.charAt(0).toUpperCase() + s.slice(1)
}

function punctuate(s){
	// Checks if s is really a string:
	if (typeof s !== 'string') return ""
	// Punctuate:
	if (s.charAt(s.length-1) != ".") s += "."
	return s
}
