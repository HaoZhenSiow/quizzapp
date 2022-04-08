const DECK_CONTAINER = document.querySelector('main.local-container');
const DECK_HEADER = document.querySelector('div.cardset#deck_cover');
const CARD_LIST = document.querySelector('main.card-list');
var decks = JSON.parse(localStorage.getItem("decks") || '[]');

//render local decks once when document load
DECK_CONTAINER?render_decks():null;

//allow local decks to sort
$(document).ready(() => {
	$(DECK_CONTAINER).sortable({
		update: () => {swap_deck_position()}
	},{handle: '.handle'});
});

const DECKS_SEARCH = document.querySelector('input#searchDeck');
DECKS_SEARCH.onkeyup = function() {searchDeck()}

function render_decks() {
	$(DECK_CONTAINER).html("");
	sort_by_position(decks);
	decks.forEach(deck => {
		let quizCardReady = 0;
		deck.cards.forEach(card => {
			//deck_type true means space repitition; false means active recall
			(new Date() > card.quiz_date && deck.deck_type)?quizCardReady++:null;
		});
		quizCardReady = quizCardReady?`(${quizCardReady})`:``;
		let html = `
		<div class="cardset ${deck.deck_color}" data-position="${deck.position}">
			<h3 class="deck-title">
				<span class="handle grab">${deck.title}</span>
			</h3>
			<small>${decktype(deck)}</small>
			<div class="control">
				<a onclick="openCardList(${deck.position})">Cards</a>
				<a onclick="openStudy(${deck.position})">Study</a>
				<a onclick="startQuiz(${deck.position})">Quiz${quizCardReady}</a>
				<a class="more-btn" onmouseover='load_more(${deck.position});'>
					<i class="far fa-caret-square-down"></i>
				</a>
				<div class="more-control">
					<a onclick="edit_deck(${deck.position})">Edit</a>
					<a>Upload</a>
					<a>Merge</a>
					<a onclick="reset(${deck.position})">Reset</a>
					<a onclick="confirm('Press ok to delete &quot;${decks[deck.position-1].title}&quot;.')
					?del_deck(${deck.position-1}):null;">Delete</a>
				</div>
          		<div class="filter"></div>
			</div>
		</div>`;
		$(DECK_CONTAINER).append(html);
	});
}

function decktype(deck) {
	let string;
	let b1=b2=b3=b4=b5=b6=b7=b8=memorised=total=0;
	deck.cards.forEach(card => {
		switch(card.box) {
			case 1: b1+=1;break;
			case 2: b2+=1;break;
			case 3: b3+=1;break;
			case 4: b4+=1;break;
			case 5: b5+=1;break;
			case 6: b6+=1;break;
			case 7: b7+=1;break;
			case 8: b8+=1;break;				
		}
		if(!card.hide) {
			total++;
			card["redo"]?null:memorised++;
		}
	});
	deck.deck_type?
	string = `${b1}, ${b2}, ${b3}, ${b4}, ${b5}, ${b6}, ${b7}, ${b8}`:
	string = `${memorised}/${total} cards memorised`;
	return string;
}

function del_deck(position){
	decks.splice(position, 1);
	decks.forEach((deck, index) => {deck.position = index+1});
	localStorage.setItem('decks', JSON.stringify(decks));
	render_decks();
	DECKS_SEARCH.value?searchDeck():null;
}

function load_more(position) {
 	let dropdown = $("div.more-control")[position-1];
	let filter = dropdown.nextElementSibling;
	if(detectmob()){
		dropdown.style.pointerEvents = "none";
		filter.style.pointerEvents = "none";
		setTimeout(() => {
			dropdown.style.pointerEvents = "auto";
			filter.style.pointerEvents = "auto";
		},1);
	}
	dropdown.style.display = "flex";
	filter.style.display = "block";
	filter.onmouseenter = () => {
		setTimeout(() => {
			dropdown.style.display = "none";
			filter.style.display = "none";
		},1);
	}
	let btn = $("a.more-btn")[position-1];
	let space = $(window).height() - btn.getBoundingClientRect().top;
	let height = $(dropdown).height();
	switch(true) {
		case(space < height):
			dropdown.style.bottom = 0;
			dropdown.style.top = "";
			break;
		case(space > height):
			dropdown.style.top = 0;
			dropdown.style.bottom = "";
			break;
		case(space < height && DECK_CONTAINER.style.display==="none"):
			dropdown.style.bottom = "46px";
			dropdown.style.top = "";
			break;
	}
	//adjust_dropdown(position);
}

function swap_deck_position(){
	$(DECK_CONTAINER).children().each(function(index) {
		let position = Number($(this).attr('data-position'));
		let newPosition = index + 1;
		if (position != newPosition) {
			$(this).attr('data-position', (index+1));
			decks[position-1].position = newPosition;
		}
	});
	sort_by_position(decks);
	localStorage.setItem('decks', JSON.stringify(decks));
}

function searchDeck() {
	let filter = DECKS_SEARCH.value.toUpperCase();
	let titles = document.querySelectorAll('h3.deck-title');
	for(let i = 0; i < titles.length; i++) {
		let title = titles[i].textContent;
		(title.toUpperCase().indexOf(filter) > -1)?
		titles[i].parentNode.style.display = "":
		titles[i].parentNode.style.display = "none";
	}
	DECKS_SEARCH.value?
	$(DECK_CONTAINER).sortable('disable'):
	$(DECK_CONTAINER).sortable('enable');
}

// //create/edit deck
const form_title = $("form.create_deck")[0]['deck-title'];
const form_type = $("form.create_deck")[0]['deck-type'];
const form_color = $("form.create_deck")[0]['deck-color'];
const form_shuffle = $("form.create_deck")[0]['shuffle'];
var targeted_deck = '';

$("form.create_deck").submit(e => {
	e.preventDefault();
	let title = form_title.value;
	let type = Boolean(form_type.value);
	let color = form_color.value;
	let shuffle = form_shuffle.checked;
	targeted_deck?
	update_target_deck(title, type, color, shuffle):
	append_deck(title, type, color, shuffle);
	render_decks();
	$('div#add_deck_modal').trigger('modalClose');
	DECKS_SEARCH.value?searchDeck():null;
});

$('div#add_deck_modal').on('modalClose', () => {
	targeted_deck = '';
	form_title.value = '';
	form_type.value = 'true';
	form_color.value = 'default';
	form_shuffle.checked = '';
	$('div#add_deck_modal').hide();
})

function edit_deck(position) {
	targeted_deck = decks[position-1];
	let dropdown = $("div.more-control")[position-1];
	let filter = dropdown.nextElementSibling;
	dropdown.style.display = "none";
	filter.style.display = "none";
	$('div#add_deck_modal').show();
	form_title.value = targeted_deck.title;
	form_type.value = targeted_deck.deck_type || '';
	form_color.value = targeted_deck.deck_color;
	form_shuffle.checked = targeted_deck.shuffle;
}
	
function append_deck(title,type,color,shuffle) {
	let new_deck = {"title": title,
		"deck_type": type,
		"deck_color": color, 
		"shuffle": shuffle, 
		"position": decks.length+1,
		"cards": []}
	decks.push(new_deck);
	localStorage.setItem('decks', JSON.stringify(decks));
}

function update_target_deck(title,deck_type,deck_color,shuffle) {
	targeted_deck.title = title;
	targeted_deck.deck_type = deck_type;
	targeted_deck.deck_color = deck_color;
	targeted_deck.shuffle = shuffle;
	localStorage.setItem('decks', JSON.stringify(decks));
}

function openCardList(position) {
	$(DECK_CONTAINER).html("");
	$(DECK_CONTAINER).hide();
	$('a#create').hide();
	$(DECKS_SEARCH).hide();
	$(DECK_HEADER).show();
	$(CARD_LIST).show();
	targeted_deck = decks[position-1];
	renderCardCover();
	$(CARD_LIST).html("");
	targeted_deck.cards?list_cards(targeted_deck):null;
}

function closeCardList() {
	$(DECK_HEADER).hide();
	$(CARD_LIST).hide();
	$(DECK_CONTAINER).show();
	$('a#create').show();
	$(DECKS_SEARCH).show();
	targeted_deck = '';
	render_decks();
	CARDS_SEARCH.value='';
	$('input#searchCard').hide();
	$(CARD_LIST).sortable('enable');
	DECKS_SEARCH.value?searchDeck():null;
}

function renderCardCover() {
	$(DECK_HEADER).attr('class', 'cardset');
	$(DECK_HEADER).addClass(`${targeted_deck.deck_color}`);
	let html = `
	<div>
		<h3>${targeted_deck.title}</h3>
		<i class="fas fa-times" onclick="closeCardList()"></i>
	</div>
	<small>${decktype(targeted_deck)}</small>
	<div class="control">
		<a onclick="openAddCardModal()">
			<i class="fas fa-plus"></i>
		</a>
		<a onclick="toggleSearch()">
			<i class="fas fa-search"></i>
		</a>
		<a id="filter">
			<i class="fas fa-filter"></i>
		</a>
	</div>`
	// <a><i class="fas fa-th-list"></i></a>
	
	$(DECK_HEADER).html(html);
	$('a#filter').click(() => {
		$('div#filter_modal').show();
	});
}

function list_cards(deck){
	let html = '';
	deck.cards.forEach(card => {
		let q = formatText(card.q);
		let a = formatText(card.a);
		let p = card.position;
		let b = card.box;
		let string = card.hide?`hidden`:'';
		html += `
		<div class="card ${string}" data-position="${p}">
			<a class="more-btn">
				<i class="far fa-caret-square-down" onmouseover='load_more(${p});'></i>
			</a>
			<div class="more-control">
				<a onclick="edit_card(${p})">Edit</a>
				<a onclick="del_card(${p})">Delete</a>
			</div>
          	<div class="filter"></div>
			<p><span class="handle grab">${p}</span>. ${q}</p>
			<hr>
			<p>${a}</p>
		</div>`
		
	});
	$(CARD_LIST).html(html);

}

//allow local decks to sort
$(document).ready(() => {
	$(CARD_LIST).sortable({
		update: () => {swap_card_position()}
	},{handle: '.handle'});
});

function swap_card_position(){
	$(CARD_LIST).children().each(function(index) {
		let position = Number($(this).attr('data-position'));
		let newPosition = index + 1;
		if (position != newPosition) {
			let card = targeted_deck.cards[position-1];
			let q = formatText(card.q);
			let a = formatText(card.a);
			let html = `<a class="more-btn">
				<i class="far fa-caret-square-down" onmouseover='load_more(${newPosition});'></i>
			</a>
			<div class="more-control">
				<a onclick="edit_card(${newPosition})">Edit</a>
				<a onclick="del_card(${newPosition})">Delete</a>
			</div>
          	<div class="filter"></div>
			<p><span class="handle grab">${newPosition}</span>. ${q}</p>
			<hr>
			<p>${a}</p>`;
			$(this)[0].innerHTML = html;
			$(this).attr('data-position', (index+1));
			targeted_deck.cards[position-1].position = newPosition;
		}
	});
	sort_by_position(targeted_deck.cards);
	localStorage.setItem('decks', JSON.stringify(decks));
}

const form_question = $("form.create_card")[0]['question'];
const form_answer = $("form.create_card")[0]['answer'];
const form_autocheck = $("form.create_card")[0]['autocheck'];
var targeted_card = '';
const CARDS_SEARCH = document.querySelector('input#searchCard');
CARDS_SEARCH.onkeyup = function() {searchCard();}

function searchCard() {
	let filter = CARDS_SEARCH.value.toUpperCase();
	let qns = document.querySelectorAll("div.card p:nth-child(4)");
	let ans = document.querySelectorAll("div.card p:nth-child(6)");
	for (let i = 0; i < qns.length; i++) {
		let cut;
		switch (true) {
			case (i<9): cut = 3; break;
			case (i<99): cut = 4; break;
			case (i<999): cut = 5; break;
			case (i<9999): cut = 6; break;
			case (i<99999): cut = 7; break;
			default: break;
		}
		//slice away the numbering
		let q = qns[i].textContent.slice(cut);
		let a = ans[i].textContent;
		let str = q + " " + a;
		(str.toUpperCase().indexOf(filter) > -1)?
		ans[i].parentNode.style.display = "":
		ans[i].parentNode.style.display = "none";
	}
	CARDS_SEARCH.value?
	$(CARD_LIST).sortable('disable'):
	$(CARD_LIST).sortable('enable');
}

form_question.addEventListener('keydown', (e) => {
	if (e.key == 'Tab') {
		e.preventDefault();
		//console.log(form_question.selectionStart);
		var start = form_question.selectionStart;
		var end = form_question.selectionEnd;

		// set textarea value to: text before caret + tab + text after caret
		form_question.value = form_question.value.substring(0, start) +
		"\t" + form_question.value.substring(end);

		// // // put caret at right position again
		form_question.selectionStart =
		form_question.selectionEnd = start + 1;
	}
});
form_answer.addEventListener('keydown', (e) => {
	if (e.key == 'Tab') {
		e.preventDefault();
		
		let start = form_answer.selectionStart;
		let end = form_answer.selectionEnd;

		// // set textarea value to: text before caret + tab + text after caret
		form_answer.value = form_answer.value.substring(0, start) +
		"\t" + form_answer.value.substring(end);

		// // put caret at right position again
		form_answer.selectionStart =
		form_answer.selectionEnd = start + 1;
	}
});
// form_autocheck.addEventListener('change', (e)=> {
// 	console.log(form_autocheck.checked);
// });


function openAddCardModal() {
	$('div#add_card_modal').show();
}

function edit_card(position) {
	targeted_card = targeted_deck.cards[position-1];
	if (DECK_HEADER.style.display === "block") {
		let dropdown = $("div.more-control")[position-1];
		let filter = dropdown.nextElementSibling;
		dropdown.style.display = "none";
		filter.style.display = "none";
	}
	$('div#add_card_modal').show();
	form_question.value = targeted_card.q;
	form_answer.value = targeted_card.a;
	form_autocheck.checked = targeted_card.autocheck;
}

$('div#add_card_modal').on('modalClose', () => {
	targeted_card = '';
	form_question.value = '';
	form_answer.value = '';
	$('div#add_card_modal').hide();
});

$("form.create_card").submit( e => {
	e.preventDefault();
	let question = form_question.value;
	let answer = form_answer.value;
	let autocheck = form_autocheck.checked;
	targeted_card?update_target_card(question,answer, autocheck):append_card(question, answer, autocheck);
	$('div#add_card_modal').trigger('modalClose');
	refreshCardList();
});

function append_card(question,answer, autocheck) {
	let cards = targeted_deck.cards;
	let cardsLen = cards.length;
	let new_card = {
		"position": cardsLen+1,
		"q": question,
		"a": answer,
		"autocheck": autocheck,
		"box": 1,
		"tier": 0,
		"quiz_date": 0,
		"redo": 1,
		"cd": 0,
		"hide": false}
	cards.push(new_card);
	localStorage.setItem('decks', JSON.stringify(decks));
}

function update_target_card(question,answer, autocheck) {
	targeted_card.q = question;
	targeted_card.a = answer;
	targeted_card.autocheck = autocheck;
	localStorage.setItem('decks', JSON.stringify(decks));
}

function del_card(position){
	targeted_deck.cards.splice(position-1, 1);
	targeted_deck.cards.forEach((deck, index) => {
		deck.position = index+1;
	});
	localStorage.setItem('decks', JSON.stringify(decks));
	refreshCardList();
}

function refreshCardList() {
	if (DECK_HEADER.style.display === "block") {
		renderCardCover();
		list_cards(targeted_deck);
	} else {
		renderStudyCard();
	}
	CARDS_SEARCH.value?searchCard():null;
}

function checkedRadio(color) {
	$("div.radio input[type=radio]").each((key, input) => {
		input.value===color?input.checked=true:null;
	});
}

function sort_by_position(arr){
	arr.sort((a, b) => {
		return a.position - b.position;
	});
}

function toggleSearch() {
	if (CARDS_SEARCH.style.display === "none") {
		CARDS_SEARCH.style.display = "block";
	} else {
		CARDS_SEARCH.style.display = "none";
		CARDS_SEARCH.value = '';
		searchCard();
	}
}

const box = {};
for (let i = 1; i < 6; i++){
	box.i = $("form.adjust_fliter")[0][`box${i}`];
	
}
const selectBox1 = new Event('selectBox1');
const selectBox2 = new Event('selectBox2');
const selectBox3 = new Event('selectBox3');
const selectBox4 = new Event('selectBox4');
const selectBox5 = new Event('selectBox5');
const selectBox6 = new Event('selectBox6');
const selectBox7 = new Event('selectBox7');
const selectBox8 = new Event('selectBox8');

$("form.adjust_fliter").submit((e) => {
	e.preventDefault();
	targeted_deck.cards.forEach(card => {
		card.hide = false;
	});
	box1.checked?filterCards(1):null;
	box2.checked?filterCards(2):null;
	box3.checked?filterCards(3):null;
	box4.checked?filterCards(4):null;
	box5.checked?filterCards(5):null;
	box6.checked?filterCards(6):null;
	box7.checked?filterCards(7):null;
	box8.checked?filterCards(8):null;
	$('div#filter_modal').trigger('modalClose');
	renderCardCover();
	list_cards(targeted_deck);
});

$('div#filter_modal').on('modalClose', () => {
	$('div#filter_modal').hide();
});

function filterCards(num) {
	targeted_deck.cards.forEach(card => {
		card.box==num?card.hide=true:null;
	});
}

var studyDeck='';
var bookmark='';
function openStudy(position) {
	$(DECK_CONTAINER).hide();
	$('div.sticky').hide();
	$('main#studycard').show();
	$('a#create').hide();
	targeted_deck = decks[position-1];
	bookmark=0;
	insertStudyCard();
	renderStudyCard();
}

function closeStudy() {
	$(DECK_CONTAINER).show();
	$('div.sticky').show();
	$('main#studycard').hide();
	$('a#create').show();
	targeted_deck = '';
	render_decks();
}

function insertStudyCard() {
	let spaceRep = Boolean(targeted_deck.deck_type);
	if (spaceRep) {
		studyDeck = targeted_deck.cards.filter(card => {
			return card.box === 1;
		});
	} else {
		studyDeck = targeted_deck.cards.filter(card => {
			return card.hide === false;
		});
	}
	if (!studyDeck.length) {
		alert("No Card in Study Deck!!!");
		closeStudy();
	} else {
		shuffle(studyDeck);
	}
}

function renderStudyCard(){
	let card = studyDeck[bookmark];
	let q = formatText(card.q);
	let html = `
	<div id="card">
		<div id="top">
			<h4 class="pointer" onclick="closeStudy()">${targeted_deck.title}</h4>
			<h4>CARD ${bookmark+1} / ${studyDeck.length}</h4>
		</div>
		<p id="qns">${q}</p>
		<div id="control">
			<i class="fas fa-trash-alt pointer" onclick="del_card('${card.position}')"></i>
			<i class="fas fa-edit pointer" onclick="edit_card('${card.position}')"></i>
		</div>
		<hr>
		<p id="ans" onclick="showAns()">[show answer]</p>
	</div>
	<div id="btm">
		<i class="fas fa-long-arrow-alt-left pointer" onclick="previous()"></i>
		<i class="fas fa-long-arrow-alt-right pointer" onclick="next()"></i>
	</div>
	`
	document.querySelector('main#studycard').innerHTML = html;
}

function previous(){
	bookmark>0?bookmark--:bookmark=studyDeck.length-1;
	renderStudyCard();
}

function next(){
	bookmark<studyDeck.length-1?bookmark++:bookmark=0;
	renderStudyCard();
}

function showAns() {
	let card = studyDeck[bookmark];
	let a = formatText(card.a);
	$('p#ans').html(a);
}

let redoCount = 0;
let quizDeck = '';

function startQuiz(position) {
	$(DECK_CONTAINER).hide();
	$('div.sticky').hide();
	$('main#quizmode').show();
	$('a#create').hide();
	targeted_deck = decks[position-1];
	renderQuiz(position);
}

function endQuiz() {
	$(DECK_CONTAINER).show();
	$('div.sticky').show();
	$('main#quizmode').hide();
	$('a#create').show();
	targeted_card = '';
	targeted_deck = '';
	render_decks();
}

function renderQuiz() {
	quizDeck = selectCardForQuiz();
	if (!quizDeck.length) {
		alert("No Card in Quiz Deck!!!");
		endQuiz();
	} else {
		let count = (quizDeck.length>1)?quizDeck.length:'LAST';
		targeted_deck.deck_type?null:count=redoCount;
		targeted_card = quizDeck[Math.floor(Math.random()*quizDeck.length)];
		let q = formatText(targeted_card.q);
		let html = `
			<div id="card">
				<div id="top">
				<h4 class="pointer" onclick="endQuiz()">${targeted_deck.title}</h4>
				<h4>${[count]} CARDS LEFT</h4>
				</div>
				<p id="qns">${q}</p>
			</div>
			<div id="keyans">
				<form id="quizAns">
					<textarea id="quizAns" name="answer" rows="5" required placeholder="type ans here" spellcheck="false"></textarea>
					<button type="submit" style="width: 100%;" accesskey="">Submit</button>
				</form>
			</div>
		`
		$('main#quizmode.studyquiz').html(html);
	}
	$("form#quizAns")[0][0].focus();
	let autocheck = targeted_card.autocheck;
	autocheck?autocheckAns():null;
	$("form#quizAns").keydown((e) => {
		if (e.keyCode === 13 && e.shiftKey) {
			e.preventDefault();
			document.querySelector("#quizAns > button").click();
		} 
		// else if (e.keyCode === 27) {
		// 	document.querySelector("#top > h4.pointer").click();
		// }
		else if (e.key == 'Tab') {
			e.preventDefault();
			let start = $("form#quizAns")[0][0].selectionStart;
			let end = $("form#quizAns")[0][0].selectionEnd;

			// // set textarea value to: text before caret + tab + text after caret
			$("form#quizAns")[0][0].value = $("form#quizAns")[0][0].value.substring(0, start) +
			"\t" + $("form#quizAns")[0][0].value.substring(end);

			// // put caret at right position again
			$("form#quizAns")[0][0].selectionStart =
			$("form#quizAns")[0][0].selectionEnd = start + 1;
		}
	});
	$("form#quizAns").submit((e) => {
		e.preventDefault();
		let a = targeted_card.a;
		let input = document.querySelector("#keyans > form > textarea");
		if (input.value === a) {
			input.style.background = "#e7ffe7";
			adjustCard(true);
			targeted_card = "";
			setTimeout(() => {renderQuiz()},500);
		} else {
			let conmf = confirm("are you sure?");
			if(conmf){
				input.style.background = "#ffd4d4";
				adjustCard(false);
				navigator.clipboard.writeText(input.value);
				targeted_card = "";
				setTimeout(() => {renderQuiz()},500);
			}
		}
	});
}

function selectCardForQuiz() {
	let cards = targeted_deck.cards;
	let spaceR = targeted_deck.deck_type
	let quizDeck = [];
	let cardsNoCD = [];
	if (spaceR) {
		cards.forEach(card => {
			new Date()>card.quiz_date?quizDeck.push(card):null;
		})
	} else {
		cards.forEach(card => {
			(!card.hide && card['redo'])?quizDeck.push(card):null;
		});
		redoCount = quizDeck.length;
		if(quizDeck.length) {
			quizDeck.forEach(card => {card.cd?null:cardsNoCD.push(card)});
			if(!cardsNoCD.length) {
				cards.forEach(card => {
					(!card.hide && !card.cd)?cardsNoCD.push(card):null;
				});
			}
			quizDeck = cardsNoCD;
		}
	}
	return quizDeck;
}

function autocheckAns() {
	$("form#quizAns").keyup((e) => {
		let a = targeted_card.a;
		let input = document.querySelector("#keyans > form > textarea");
		if (input.value === a) {
			input.style.background = "#e7ffe7";
		} else {
			input.style.background = "revert";
		}
	});
}

function adjustCard(result) {
	let type = targeted_deck.deck_type;
	//add cd to active recall card
	if (!type) {
		targeted_deck.cards.forEach(card => {
			card.cd?card.cd--:null;
		});
		targeted_card.cd = quizDeck.length<=10?3:5;
	}
	switch(true) {
		//space repetition card correct;
		case (type && result):

			targeted_card['tier']++;
			
			
			if(targeted_card['tier'] === 3 && targeted_card['box'] < 3) {
				targeted_card['tier'] = 0;
				targeted_card.box++;
			}

			if(targeted_card['tier'] === 4 && targeted_card['box'] === 3) {
				targeted_card['tier'] = 0;
				targeted_card.box++;
			}

			if(targeted_card['tier'] === 6 && targeted_card['box'] === 4) {
				targeted_card['tier'] = 0;
				targeted_card.box++;
			}

			if(targeted_card['tier'] == 9 && targeted_card['box'] < 7) {
				targeted_card['tier'] = 0;
				targeted_card.box++;
			}

			if(targeted_card['tier'] == 10 && targeted_card['box'] === 7) {
				targeted_card['tier'] = 0;
				targeted_card.box++;
			}

			// if(targeted_card['tier'] == 99 && targeted_card['box'] == 8) {
			// 	targeted_card['tier'] = 0;
			// 	targeted_card.box++;
			// }

			let milliseconds = 0;
			switch (targeted_card.box) {
				case 1:
					milliseconds = 24*60*60000;
					break;
				case 2:
					milliseconds = 3*24*60*60000;
					break;
				case 3:
					milliseconds = 7*24*60*60000;
					break;
				case 4:
					milliseconds = 2*7*24*60*60000;
					break;
				case 5:
					milliseconds = 4*7*24*60*60000;
					break;
				case 6:
					milliseconds = 3*4*7*24*60*60000;
					break;
				case 7:
					milliseconds = 6*4*7*24*60*60000;
					break;
				case 8:
					milliseconds = 12*4*7*24*60*60000;
					break;
				// case 1:
				// 	milliseconds = 1;
				// 	break;
				// case 2:
				// 	milliseconds = 1;
				// 	break;
				// case 3:
				// 	milliseconds = 1;
				// 	break;
				// case 4:
				// 	milliseconds = 1;
				// 	break;
				// case 5:
				// 	milliseconds = 1;
				// 	break;
				// case 6:
				// 	milliseconds = 1;
				// 	break;
				// case 7:
				// 	milliseconds = 1;
				// 	break;
				// case 8:
				// 	milliseconds = 1;
				// 	break;
			}
			targeted_card.quiz_date = new Date().getTime() + milliseconds;
			targeted_card.mistake=false;
			break;
		//space repetition card wrong;	
		case (type && !result):
			// targeted_card.mistake?
			(targeted_card['tier']=0, targeted_card.box=1, alert('The correct ans: ' + targeted_card.a));
			// targeted_card.mistake=true;
			break;
		//active recall card correct;
		case (!type && result):
			targeted_card['redo']?targeted_card['redo']--:null;
			break;
		//active recall card wrong;
		case (!type && !result):
			targeted_card['redo']=3;
			alert('The correct ans: ' + targeted_card.a);
			break;
	}
	localStorage.setItem('decks', JSON.stringify(decks));
}


function reset(position) {
	let deck = decks[position -1];
	let mode = deck.deck_type ? "Spaced Repetition" : "Active Recall";
	let t = deck.title;
	if (confirm("Press ok to reset "+mode+" mode for "+t)) {
		if(deck.deck_type){
			deck.cards.forEach(card => {
				card.box = 1;
				card.tier = 0;
				card.quiz_date = 0;
			});
		} else {
			deck.cards.forEach(card => {
				card.redo = 1;
				card.cd = 0;
			});
		};
		localStorage.setItem('decks', JSON.stringify(decks));
		render_decks();
	}
}
// // function addZero(i) {
// //   if (i < 10) {
// //     i = "0" + i;
// //   }
// //   return i;
// // }

// var today = new Date();
// var timeString = today.getTime();
// var past = new Date(1667190010709);
// var next_day = today.getTime() + 24*60*60000;
// var three_days = new Date(today.getTime() + 3*24*60*60000);
// var week_later = new Date(today.getTime() + 7*24*60*60000);
// var month_later = new Date(today.getTime() + 4*7*24*60*60000);
// var half_year_later = new Date(today.getTime() + 6*4*7*24*60*60000);
// // //var today = new Date(timeString);
// // //var followingDay = new Date(today.getTime() + 86400000);
// // // var dd = addZero(today.getDate());
// // // var mm = addZero(today.getMonth()+1);
// // // var yy = today.getFullYear().toString().substr(-2);
// // // var yyyy = today.getFullYear();
// // // var hh = addZero(today.getHours());
// // // var min = addZero(today.getMinutes()); 
// // // var ampm = hh >= 12 ? 'pm' : 'am';
// // // today = dd+'/'+mm+'/'+yyyy+' '+hh+':'+min+ampm;
// console.log('today,' + timeString);
// test('past, ' + past);
// test('future, ' + next_day);

// let yesterday = 1613970065246
// // let today = new Date();
// // let tmr = 1615085255910;

// if (new Date() > yesterday){
// 	test('quiz ready');
// }

// if (today > tmr){
// 	test('quiz ready a');
// }

// //return true if device is not desktop
function detectmob() { 
	if( navigator.userAgent.match(/Android/i)
	|| navigator.userAgent.match(/webOS/i)
	|| navigator.userAgent.match(/iPhone/i)
	|| navigator.userAgent.match(/iPad/i)
	|| navigator.userAgent.match(/iPod/i)
	|| navigator.userAgent.match(/BlackBerry/i)
	|| navigator.userAgent.match(/Windows Phone/i)
	){
   		return true;
 	} else {
   		return false;
 	}
}

function formatText(string) {
	let stringify = JSON.stringify(string);
	stringify = stringify.slice(1, -1);
	stringify = htmlEncode(stringify);
	stringify = stringify.replace(/\\n/g,'<br/>');
	stringify = stringify.replace(/\\t/g,'&emsp;');
	return stringify;
}

function htmlEncode(html) {
	html = $.trim(html);
	return html.replace(/\\?[&"'<>]/g, function(c) {
		switch (c) {
			case "&":
				return "&amp;";
			case "'":
	      		return "&#39;";
	      	case '"':
				return "&quot;";
	      	case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case "\\&":
				return "&amp;";
			case "\\'":
	      		return "&#39;";
	      	case '\\"':
				return "&quot;";
	      	case "\\<":
				return "&lt;";
			case "\\>":
				return "&gt;";
		}
	});
};

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}