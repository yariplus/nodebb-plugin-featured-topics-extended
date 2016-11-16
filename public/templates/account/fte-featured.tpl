<div class="account">
  <!-- IMPORT partials/account_menu.tpl -->
  <!-- IMPORT partials/account/header.tpl -->

  <!-- IF isSelf -->
  <div class="clearfix">
    <button id="fte-editor-delete" class="btn btn-danger pull-right">Delete List</button>
    <button id="fte-editor-new" class="btn btn-primary pull-right">New List</button>
  </div>
  <!-- ENDIF isSelf -->

  <div class="row">
    <div class="col-sm-12 col-md-12">
      <div class="fte-featured">
        <div class="form-group">
          <label for="list-selector">Featured List</label>
          <select id="fte-profile-list-select" class="form-control">
            <!-- BEGIN lists -->
            <option value="@value" <!-- IF @first -->selected="selected"<!-- ENDIF @first -->>@value</option>
            <!-- END lists -->
          </select>
        </div>
        <label>List Topics</label>
        <table class="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Topic</th>
              <th class="fte-m16">Category</th>
              <th class="fte-m16">Date</th>
              <th class="fte-w1" <!-- IF !isSelf -->style="display:none;"<!-- ENDIF !isSelf -->></th>
            </tr>
          </thead>
          <tbody class="fte-topic-list">
            <!-- IMPORT partials/account/fte-topic-list.tpl -->
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">
                <button class="btn btn-default" type="button" style="float:left;">&lt;</button>
                <button class="btn btn-default" type="button" style="float:right;">&gt;</button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</div>
