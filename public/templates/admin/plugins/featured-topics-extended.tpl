<form id="featured-topics-extended">
	<div class="panel panel-primary">
		<div class="panel-heading"><span class="panel-title">Topics</span></div>
		<div class="panel-body">
			<div class="form-group">
				<label for="autoFeature">Automatically feature new topics in these category IDs</label>
				<input data-key="autoFeature" type="text" class="form-control" id="autoFeature" placeholder="1" />
			</div>

			<div id="resort" class="btn btn-success">Re-sort Featured Topics</div>
		</div>
	</div>

	<div class="panel panel-primary">
		<div class="panel-heading"><span class="panel-title">News Page</span></div>
		<div class="panel-body">
			<div class="checkbox">
				<label for="newsHideAnon">
					<input data-key="newsHideAnon" id="newsHideAnon" type="checkbox">
					Hide news from guests.
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
					<div id="template-editor"></div>
					<textarea data-key="customTemplate" style="display:none;"></textarea>
				</div>
			</div>
		</div>
	</div>

	<div id="save" class="btn btn-success">Save Settings</div>
</form>

<script>
require(['settings'], function(settings) {

	settings.sync('featured-topics-extended', $('#featured-topics-extended'), function () {
		var templateEditor = ace.edit("template-editor");
		templateEditor.setTheme("ace/theme/twilight");
		templateEditor.getSession().setMode("ace/mode/html");
		templateEditor.setValue($('[data-key="customTemplate"]').val());

		templateEditor.on('change', function(e) {
			$('[data-key="customTemplate"]').val(templateEditor.getValue());
		});
	});

	$('#save').click( function (event) {
		settings.persist('featured-topics-extended', $('#featured-topics-extended'), function(){
			socket.emit('admin.settings.syncFeaturedTopicsExtended');
		});
	});
});
</script>
