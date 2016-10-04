$(() => {
  app.loadJQueryUI(() => {
    function openModalMod(ev) {
      if ($('#featured-topics-ex-modal').length) return app.error('Already editing featured topics.')

      socket.emit('admin.getFeaturedTopics', {tid: ajaxify.data.tid}, (err, topics) => {
        if (err) return app.error('Only admins can feature topics.')

        ajaxify.loadTemplate('modals/featured-topics-ex-sort', function(featuredTpl) {

          bootbox.confirm(templates.parse(featuredTpl, {topics:topics}), confirm => {
            if (!confirm) return

            const tids = []
            $('.featured-topic').each(function(i) {
              tids.push(this.getAttribute('data-tid'))
            })

            socket.emit('admin.setFeaturedTopics', {tids})
          }).on("shown.bs.modal", () => {
            $('span.timeago').timeago()
            $('#sort-featured').sortable().disableSelection()

            $('.delete-featured').on('click', function() {
              $(this).parents('.panel').remove()
            })
          })
        })
      })
    }

    function registerEventHandlers() {
      $('.topic').on('click', '.thread-tools .mark-featured', openModalMod)
      $('#resort').on('click', openModalMod)
    }

    $(window).on('action:ajaxify.end', registerEventHandlers)

    registerEventHandlers()

    let widgetsSelector = ''

    widgetsSelector += '[data-widget="featuredTopicsExSidebar"]' + ', '
    widgetsSelector += '[data-widget="featuredTopicsExBlocks"]' + ', '
    widgetsSelector += '[data-widget="featuredTopicsExCards"]' + ', '
    widgetsSelector += '[data-widget="featuredTopicsExList"]'
  })
})

$(window).on('action:widgets.loaded', (ev, data) => {
  const $widgets = $(widgetsSelector)
  $widgets.find('span.timeago').timeago()
  $widgets.find('.avatar').tooltip()
})
