$(function(){
	"use strict";

	function openModal(ev) {
		ajaxify.loadTemplate('modals/featured-topics-ex-sort', function(featuredTpl) {
			socket.emit('admin.getFeaturedTopics', {tid: ajaxify.data.tid}, function(err, topics) {
				if (err) return console.log(err);

				bootbox.confirm(templates.parse(featuredTpl, {topics:topics}), function(confirm) {
					var tids = [];
					$('.featured-topic').each(function(i) {
						tids.push(this.getAttribute('data-tid'));
					});

					socket.emit('admin.setFeaturedTopics', {tids: tids});
				}).on("shown.bs.modal", function() {
					$('span.timeago').timeago();
					$('#sort-featured').sortable().disableSelection();

					$('.delete-featured').on('click', function() {
						$(this).parents('.panel').remove();
					});
				});
			});
		});
	}

	$(window).on('action:ajaxify.end', function(ev, data) {
		if (data.url.match(/^topic/)) {
			$('.topic').on('click', '.thread-tools .mark-featured', openModal);
		}else if (data.url.match(/^admin\/plugins\/featured-topics-extended/)) {
			$('#resort').on('click', openModal);
		}

		$('.category-box').hover(function(){ $(this).prev().children().first().css('filter', 'brightness(115%)'); console.log('in'); }, function(){ $(this).prev().children().first().css('filter', ''); console.log('out'); });
	});

  var widgetsSelector = ''

  widgetsSelector += '[data-widget="featuredTopicsExSidebar"]' + ', '
  widgetsSelector += '[data-widget="featuredTopicsExBlocks"]' + ', '
  widgetsSelector += '[data-widget="featuredTopicsExCards"]' + ', '
  widgetsSelector += '[data-widget="featuredTopicsExList"]'

  $(window).on('action:widgets.loaded', function(ev, data) {
    var $widgets = $(widgetsSelector)
    $widgets.find('span.timeago').timeago()
    $widgets.find('.avatar').tooltip()
  })
});
