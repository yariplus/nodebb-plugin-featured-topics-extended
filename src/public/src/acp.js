(() => {

  let $ListSelect

  // Prepare the widget panel.
  function init (panel) {
    let group = panel.find('.fte-list-group')

    // Return if there are no slugs or the list is already populated.
    if (!group.length) return
    if (group.find('option').length) return

    group.append($ListSelect.clone())

    let sel = panel.find('.fte-editor-list-select')
    let slug = panel.find('[name="slug"]')

    // Set the select option.
    if (sel.find(`[value="${slug.val()}"]`).length) sel.val(slug.val())

    // Change the list slug when the select changes.
    sel.change(() => slug.val(sel.val()))

    // TODO
    if (!!panel.find('[name="sorted"]').val()) $('.fte-topics-sort').text('Use All Topics')
  }

  // TODO: Make this prettier.
  function resort (panel) {
    const slug = panel.find('.fte-editor-list-select').val()

    app.loadJQueryUI(() => {
      socket.emit('plugins.FeaturedTopicsExtended.getFeaturedTopics', {uid: app.user.uid, theirid: 0, slug}, (err, data) => {
        if (err) return app.alertError(err.message)

        app.parseAndTranslate('modals/fte-topics-sort', { topics: data.topics }, function (html) {
          const box = bootbox.confirm({
            title: 'Topic Order',
            message: $('<a>').append(html).html(),
            callback: function (confirm) {
              if (!confirm) return

              let tids = []
              box.find('.featured-topic').each(function (i) {
                tids.push(this.getAttribute('data-tid'))
              })
              if (!tids.length) return
              tids = tids.join(',')

              panel.find('[name="sorted"]').val(tids)
              panel.find('.fte-topics-sort').text('Use All Topics')
            }
          }).on("shown.bs.modal", function () {
            $('span.timeago').timeago()
            $('.fte-sort-featured').sortable().disableSelection()

            $('.delete-featured').on('click', function () {
              $(this).parents('.panel').remove()
            })
          })
        })
      })
    })
  }

  $(window).on('action:ajaxify.end', function (event, data) {
    if (data.url.match('admin/extend/widgets')) {
      // Populate the list select.
      app.parseAndTranslate('partials/fte-list-select', { lists: ajaxify.data.lists }, html => $ListSelect = $(html))

      $('.widget-area').on('mouseup', '> .panel > .panel-heading', function () { init($(this).parent()) })

      $('.widget-area').on('click', '.fte-topics-sort', function () {
        const panel = $(this).closest('.panel')

        if (panel.find('[name="sorted"]').val()) {
          panel.find('[name="sorted"]').val('')
          panel.find('.fte-topics-sort').text('Use Specific Topics')
        } else {
          resort(panel)
        }
      })
    }
  })
})()
