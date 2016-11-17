<div class="form-group">
  <label for="fte-editor-list-select">Featured Topics List</label>
  <select class="form-control fte-editor-list-select" name="slug">
    <!-- BEGIN lists -->
    <option value="{lists.slug}" <!-- IF @first -->selected="selected"<!-- ENDIF @first -->>{lists.userTitle}</option>
    <!-- END lists -->
  </select>
</div>
