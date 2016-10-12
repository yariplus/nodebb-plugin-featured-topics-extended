$(() => {
  app.loadJQueryUI(() => {
    function openModal (lists) {
      lists = lists.map(list => `<option value="${list}">${list}</option>`).join('')

      bootbox.dialog({
        size: 'large',
        title: 'Select a Featured Topic List',
        message: `<form class="bootbox-form"><select class="bootbox-input bootbox-input-select form-control">${lists}</select></form><br><a>or click here to Manage your Featured Topic Lists</a>`,
        show: true,
        onEscape: true,
        buttons: {
          'cancel': { label: 'Cancel', className: 'btn-primary', callback: function () {} },
          'accept': { label: 'Add Topic', className: 'btn-default', callback: function () {console.log($('.bootbox-input').val())} }
        }
      })
    }

    function openUserListSelect () {
      if ($('#featured-topics-ex-modal').length) return app.error('Already editing featured topics.')

      socket.emit('plugins.FeaturedTopicsExtended.getUserFeaturedLists', {uid: parseInt(ajaxify.data.uid, 10)}, (err, lists) => {
        if (err) app.error(err)
        if (!lists || !lists.length) app.error('Unable to get featured topic lists.')

        openModal(lists)
      })
    }

    function openModListSelect () {
      if ($('#featured-topics-ex-modal').length) return app.error('Already editing featured topics.')

      socket.emit('plugins.FeaturedTopicsExtended.getGlobalFeaturedLists', {}, (err, lists) => {
        if (err) app.error(err)
        if (!lists || !lists.length) app.error('Unable to get featured topic lists.')

        openModal(lists)
      })
    }

    function registerEventHandlers () {
      $('[component="topic"]').on('click', '.thread-tools .mark-featured', openModListSelect)
      $('[component="topic"]').on('click', '[component="mark-featured"]', openUserListSelect)
    }

    $(window).on('action:ajaxify.end', registerEventHandlers)

    registerEventHandlers()
  })
})

$(window).on('action:widgets.loaded', (ev, data) => {
  let widgetsSelector = ''

  widgetsSelector += '[data-widget="featuredTopicsExSidebar"]' + ', '
  widgetsSelector += '[data-widget="featuredTopicsExBlocks"]' + ', '
  widgetsSelector += '[data-widget="featuredTopicsExCards"]' + ', '
  widgetsSelector += '[data-widget="featuredTopicsExList"]'

  const $widgets = $(widgetsSelector)
  $widgets.find('span.timeago').timeago()
  $widgets.find('.avatar').tooltip()
})
