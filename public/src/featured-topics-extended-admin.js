define('admin/plugins/featured-topics-extended', ['settings', 'ace/ace'], (settings, ace) => {
  return { async init () { 
    settings.sync('featured-topics-extended', $('#fte-admin-page'), () => {
      let templateEditor = ace.edit('template-editor')

      templateEditor.setTheme('ace/theme/twilight')
      templateEditor.getSession().setMode('ace/mode/html')
      templateEditor.setValue($('[data-key="customTemplate"]').val())

      templateEditor.on('change', function (e) {
        $('[data-key="customTemplate"]').val(templateEditor.getValue())
      })

      $('#save').click(function (event) {
        settings.persist('featured-topics-extended', $('#fte-admin-page'), function () {
          socket.emit('admin.settings.syncFeaturedTopicsExtended')
        })
      })
    })
  }}
})
