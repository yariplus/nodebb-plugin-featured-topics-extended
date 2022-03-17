fte = {}

fte.setupEditor = (theirid) => {
  $('#fte-editor-list-add').click(() => {
    bootbox.prompt('Create a list', list => {
      if (!list) return

      socket.emit('plugins.FeaturedTopicsExtended.createList', {theirid, list}, err => {
        if (err) {
          app.alertError(err.message)
        } else {
          app.alertSuccess(`Created list <b>${list}</b>!`)
          $('.fte-editor-list-select').append(`<option value="${list}">${list}</option>`)
        }
      })
    })
  })

  $('#fte-editor-list-delete').click(() => {
    const slug = $('.fte-editor-list-select').val()
    const list = $(`option[value="${slug}"]`).text()

    if (slug === 'news' || slug === 'blog') return app.alertError(`Cannot delete list ${list}.`)

    bootbox.confirm(`Are you sure you want to delete the list <b>${list}</b>?`, confirm => {
      if (!confirm) return

      socket.emit('plugins.FeaturedTopicsExtended.deleteList', {theirid, slug}, err => {
        if (err) return app.alertError(err.message)

        app.alertSuccess(`Deleted list <b>${list}</b>!`)

        $(`.fte-editor-list-select [value="${slug}"]`).remove()
        $(`.fte-editor-list-select`).val($(`.fte-editor-list-select option`).first().val())
        $(`.fte-editor-list-select`).change()
      })
    })
  })

  $('.fte-editor-list-select').change(function () {
    const slug = $(this).val()
    const page = 1

    socket.emit('plugins.FeaturedTopicsExtended.getFeaturedTopics', {theirid, slug, page}, (err, data) => {
      if (err) return app.alertError(err.message)

      app.parseAndTranslate('partials/fte-topic-list', {topics: data.topics, isSelf: ajaxify.data.isSelf}, html => {
        $('.fte-topic-list').html(html)
        $('.fte-topic-list').data('page', 1)
      })

      $('#fte-editor-list-autofeature').val(data.list.autoFeature.join(','))
    })
  })

  $('#fte-editor-list-autofeature-save').click(function () {
    const autoFeature = $('#fte-editor-list-autofeature').val()
    const slug = $('.fte-editor-list-select').val()

    socket.emit('plugins.FeaturedTopicsExtended.setAutoFeature', {theirid, slug, autoFeature}, (err, data) => {
      if (err) return app.alertError(err.message)

      app.alertSuccess('Save auto feature')
    })
  })

  $('#fte-editor').on('click', '.fa-close', function () {
    const slug = $('.fte-editor-list-select').val()
    const tid = $(this).data('tid')
    const row = $(this).closest('tr')

    socket.emit('plugins.FeaturedTopicsExtended.unfeatureTopic', {theirid, slug, tid}, (err, data) => {
      if (err) return app.alertError(err.message)

      app.alertSuccess('Unfeatured topic')

      const page = $('.fte-topic-list').data('page')

      socket.emit('plugins.FeaturedTopicsExtended.getFeaturedTopics', {theirid, slug, page}, (err, data) => {
        if (err) return app.alertError(err.message)
        if (!data || !data.topics) return

        app.parseAndTranslate('partials/fte-topic-list', {topics: data.topics, isSelf: ajaxify.data.isSelf}, html => {
          $('.fte-topic-list').html(html)
        })
      })
    })
  })

  $('#fte-editor').on('click', '.fte-topics-list-prev', function () {
    let page = $('.fte-topic-list').data('page')
    if (page === 1) return

    page--
    const slug = $('.fte-editor-list-select').val()

    socket.emit('plugins.FeaturedTopicsExtended.getFeaturedTopics', {theirid, slug, page}, (err, data) => {
      if (err) return app.alertError(err.message)
      if (!data || !data.topics || !data.topics.length) return

      app.parseAndTranslate('partials/fte-topic-list', {topics: data.topics, isSelf: ajaxify.data.isSelf}, html => {
        $('.fte-topic-list').html(html)
        $('.fte-topic-list').data('page', page)
      })
    })
  })

  $('#fte-editor').on('click', '.fte-topics-list-next', function () {
    let page = $('.fte-topic-list').data('page')

    page++
    const slug = $('.fte-editor-list-select').val()

    socket.emit('plugins.FeaturedTopicsExtended.getFeaturedTopics', {theirid, slug, page}, (err, data) => {
      if (err) return app.alertError(err.message)
      if (!data || !data.topics || !data.topics.length) return

      app.parseAndTranslate('partials/fte-topic-list', {topics: data.topics, isSelf: ajaxify.data.isSelf}, html => {
        $('.fte-topic-list').html(html)
        $('.fte-topic-list').data('page', page)
      })
    })
  })

  $('.fte-editor-list-select').val($('.fte-editor-list-select [selected]').val())
  $('#fte-editor-list-autofeature').val(ajaxify.data.list.autoFeature.join(','))
  $('.fte-topic-list').data('page', 1)
}

$(window).on('action:ajaxify.end', async () => {
  if (ajaxify.data.template['fte-featured']) fte.setupEditor()
  if (ajaxify.data.template['account/fte-featured']) fte.setupEditor(ajaxify.data.theirid)

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

  function openTopicsListModal (theirid) {
    if ($('#featured-topics-ex-modal').length) return app.alertError('Already editing featured topics.')

    socket.emit('plugins.FeaturedTopicsExtended.getFeaturedTopicsLists', {theirid}, (err, lists) => {
      if (err) return app.alertError(err.message)
      if (!lists || !lists.length) return app.alertError('Unable to get featured topic lists.')

      openModal(theirid, lists)
    })
  }

  function openModal (theirid, lists) {
    app.loadJQueryUI(async () => {
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
    })
  }
})
