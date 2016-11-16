$(() => {
  app.loadJQueryUI(() => {
    function openModal (theirid, lists) {
      const {tid, title} = ajaxify.data

      if (!tid) return console.log('No tid for featured topic modal.')

      templates.parse('modals/fte-listselect', {lists, title}, (html) => {
        bootbox.dialog({
          size: 'large',
          title: `Featuring topic: "${title}"`,
          message: html,
          show: true,
          onEscape: true,
          buttons: {
            'cancel': {
              label: 'Cancel',
              className: 'btn-primary',
              callback: () => {}
            },
            'accept': {
              label: 'Add Topic',
              className: 'btn-default',
              callback: () => {
                socket.emit('plugins.FeaturedTopicsExtended.featureTopic', {
                  tid,
                  theirid,
                  list: $('#fte-topic-list-select').val()
                }, err => {
                  if (err) return app.alertError(err)

                  app.alertSuccess('Featured Topic')
                })
              }
            }
          }
        })
      })
    }

    function openTopicsListModal (theirid) {
      if ($('#featured-topics-ex-modal').length) return app.alertError('Already editing featured topics.')

      socket.emit('plugins.FeaturedTopicsExtended.getFeaturedTopicsLists', {theirid}, (err, lists) => {
        if (err) return app.alertError(err.message)
        if (!lists || !lists.length) return app.alertError('Unable to get featured topic lists.')

        openModal(theirid, lists)
      })
    }

    function registerEventHandlers () {
      $('[component="topic"]').on('click', '.thread-tools .mark-featured', () => {openTopicsListModal()})
      $('[component="topic"]').on('click', '[component="mark-featured"]', () => {openTopicsListModal(app.user.uid)})
    }

    $(window).on('action:ajaxify.end', registerEventHandlers)

    registerEventHandlers()
  })

  define('forum/account/fte-featured', ['forum/account/header'], header => {
    return {
      init () {
        header.init()
        setupEditor(ajaxify.data.theirid)
      }
    }
  })

  define('forum/fte-featured', () => {
    return {
      init () {
        header.init()
        setupEditor()
      }
    }
  })

  function setupEditor (theirid) {
    $('.fte-btn-list-add').click(() => {
      bootbox.prompt('Create a list', list => {
        if (!list) return

        socket.emit('plugins.FeaturedTopicsExtended.createList', {theirid, list}, err => {
          if (err) {
            app.alertError(err.message)
          } else {
            app.alertSuccess(`Created list <b>${list}</b>!`)
            $('#fte-profile-list-select').append(`<option value="${list}">${list}</option>`)
          }
        })
      })
    })
  }

  define('forum/account/fte-blog', ['forum/account/header'], header => {
    return {
      init () {
        header.init()
      }
    }
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
