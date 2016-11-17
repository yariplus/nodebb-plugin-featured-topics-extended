<form id="fte-admin-page">
  <a href="{config.relative_path}/featured" class="btn btn-default" target="_blank">Edit Featured Topic Lists</a>

  <br><br>

  <div class="panel panel-primary">
    <div class="panel-heading"><span class="panel-title">News Page Settings</span></div>
    <div class="panel-body">
      <div class="checkbox">
        <label for="newsHideAnon" class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
          <input id="newsHideAnon" class="mdl-switch__input" type="checkbox" data-key="newsHideAnon">
          <span class="mdl-switch__label"><strong>Hide news from guests.</strong></span>
        </label>
      </div>
      <div class="form-group">
        <label for="newsTemplate">Template</label>
        <select data-key="newsTemplate" name="newsTemplate" class="form-control">
          <option value="porta" selected="selected">Porta</option>
          <option value="Scout">Scout</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div class="panel panel-warning">
        <div class="panel-heading btn-warning pointer" data-toggle="collapse" data-target=".themes">
          <h3 class="panel-title"><i class="fa fa-caret-down pull-right"></i>Custom Template</h3>
        </div>
        <div class="panel-body collapse themes">
          <div id="template-editor" class="fte-ace"></div>
          <textarea data-key="customTemplate" style="display:none;"></textarea>
        </div>
      </div>
    </div>
  </div>

  <button type="button" id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored"><i class="material-icons">save</i></button>
</form>

<script>
require(['settings'], function(settings) {

  settings.sync('featured-topics-extended', $('#fte-admin-page'), function () {
    var templateEditor = ace.edit("template-editor");
    templateEditor.setTheme("ace/theme/twilight");
    templateEditor.getSession().setMode("ace/mode/html");
    templateEditor.setValue($('[data-key="customTemplate"]').val());

    templateEditor.on('change', function(e) {
      $('[data-key="customTemplate"]').val(templateEditor.getValue());
    });
  });

  $('#save').click( function (event) {
    settings.persist('featured-topics-extended', $('#fte-admin-page'), function(){
      socket.emit('admin.settings.syncFeaturedTopicsExtended');
    });
  });
});
</script>
