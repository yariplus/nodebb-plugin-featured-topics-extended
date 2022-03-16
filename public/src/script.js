$(() => {
  config.fte = {}

  app.loadJQueryUI(() => {
    async function openModal (theirid, lists) {
      const {tid, title} = ajaxify.data

      if (!tid) return console.log('No tid for featured topic modal.')

      const Bootbox = await require('bootbox')

      Bootbox.dialog({
        size: 'large',
        title: `Featuring topic: "${title}"`,
        message: await app.parseAndTranslate('modals/fte-listselect', { lists, title }),
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
                slug: $('#fte-topic-list-select').val()
              }, err => {
                if (err) return app.alertError(err.message)

                app.alertSuccess('Featured Topic')
              })
            }
          }
        }
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

    async function registerEventHandlers () {
      const Masonry = await app.require('masonry')

      $('.grid').each(async (i, el) => {
        new Masonry(el)
      })

      $('.topic').on('click', '.thread-tools .mark-featured', () => openTopicsListModal())
      $('[component="topic"]').on('click', '[component="mark-featured"]', () => openTopicsListModal(app.user.uid))

      $('.glide').each(async (i, el) => {
        const Glide = await app.require('glide')

        let glide = new Glide(el, {
          type: 'carousel',
          gap: 0,
          perView: 3,
          startAt: 1,
          focusAt: 'center',
          breakpoints: {
            768: {
              perView: 2,
              focusAt: 1
            },
            576: {
              perView: 1,
              focusAt: 1
            }
          }
        })

        glide.mount()
      })
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

  

  define('forum/account/fte-blog', ['forum/account/header'], header => {
    return {
      init () {
        header.init()
      }
    }
  })
})
