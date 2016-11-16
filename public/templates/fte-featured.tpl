<!-- IF isSelf -->
  <button class="fte-btn-list-add btn btn-primary" type="button" style="float:right;">Create New List</button>
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
              <th>Category</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody class="fte-topic-list">
            <!-- IMPORT partials/account/fte-topic-list.tpl -->
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">
                <button class="btn btn-default" type="button" style="float:left;">&lt;</button>
                <button class="btn btn-default" type="button" style="float:right;">&gt;</button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
