//CREATE MODAL
$('a#create').click(() => {
	$('div#add_deck_modal').show();
});

//const filterModal = document.querySelector('div#filter_modal');

window.onclick = (e) => {
	e.target == $('div#add_deck_modal')[0] || e.target == $('span#add_deck_modal')[0]?
	$('div#add_deck_modal').trigger('modalClose'):null;
	e.target == $('div#add_card_modal')[0] || e.target == $('span#add_card_modal')[0]?
	$('div#add_card_modal').trigger('modalClose'):null;
	e.target == $('div#filter_modal')[0] || e.target == $('span.close#fliter_modal')[0]?
	$('div#filter_modal').trigger('modalClose'):null;
}

//filter toggle on card cover instead of filter form