define('forum/fte-featured', ['alerts', 'bootbox'], function (alerts, bootbox) {
	let fte = {}

  fte.setupEditor = (theirid) => {
    $('#fte-editor-list-add').click(() => {
      bootbox.prompt('Create a list', list => {
        if (!list) return

        socket.emit('plugins.FeaturedTopicsExtended.createList', {theirid, list}, err => {
          if (err) {
            alerts.error(err.message)
          } else {
            alerts.success(`Created list <b>${list}</b>!`)
            $('.fte-editor-list-select').append(`<option value="${list}">${list}</option>`)
          }
        })
      })
    })

    $('#fte-editor-list-delete').click(() => {
      const slug = $('.fte-editor-list-select').val()
      const list = $(`option[value="${slug}"]`).text()

      if (slug === 'news' || slug === 'blog') return alerts.error(`Cannot delete list ${list}.`)

      bootbox.confirm(`Are you sure you want to delete the list <b>${list}</b>?`, confirm => {
        if (!confirm) return

        socket.emit('plugins.FeaturedTopicsExtended.deleteList', {theirid, slug}, err => {
          if (err) return alerts.error(err.message)

          alerts.success(`Deleted list <b>${list}</b>!`)

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
        if (err) return alerts.error(err.message)

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
        if (err) return alerts.error(err.message)

        alerts.success('Save auto feature')
      })
    })

    $('#fte-editor').on('click', '.fa-close', function () {
      const slug = $('.fte-editor-list-select').val()
      const tid = $(this).data('tid')
      const row = $(this).closest('tr')

      socket.emit('plugins.FeaturedTopicsExtended.unfeatureTopic', {theirid, slug, tid}, (err, data) => {
        if (err) return alerts.error(err.message)

        alerts.success('Unfeatured topic')

        const page = $('.fte-topic-list').data('page')

        socket.emit('plugins.FeaturedTopicsExtended.getFeaturedTopics', {theirid, slug, page}, (err, data) => {
          if (err) return alerts.error(err.message)
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
        if (err) return alerts.error(err.message)
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
        if (err) return alerts.error(err.message)
        if (!data || !data.topics || !data.topics.length) return

        app.parseAndTranslate('partials/fte-topic-list', {topics: data.topics, isSelf: ajaxify.data.isSelf}, html => {
          $('.fte-topic-list').html(html)
          $('.fte-topic-list').data('page', page)
        })
      })
    })

    $('.fte-editor-list-select').val($('.fte-editor-list-select [selected]').val())
    //$('#fte-editor-list-autofeature').val(ajaxify.data.list.autoFeature.join(','))
    $('.fte-topic-list').data('page', 1)
  }

	fte.init = function () {
    console.log('featured.js loaded!')
    
    fte.setupEditor()
	}

	return fte
})
