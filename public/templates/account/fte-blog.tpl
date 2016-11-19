<div class="account">
  <!-- IMPORT partials/account_menu.tpl -->
  <!-- IMPORT partials/account/header.tpl -->

  <br><br>

  <div class="row">
    <div widget-area="header" class="col-sm-12 col-lg-12"></div>
    <div class="col-lg-12 col-sm-12" has-widget-class="col-lg-9 col-sm-12" has-widget-target="sidebar">
      <div class="row">
        <div widget-area="leftsidebar" class="col-lg-3 col-sm-12"></div>
        <div class="col-lg-12 col-sm-12" has-widget-class="col-lg-9 col-sm-12" has-widget-target="leftsidebar">
          <div widget-area="contenttop"></div>
          <div class="fte-blog">{featuredTemplate}</div>
          <div widget-area="contentbottom"></div>
        </div>
      </div>
    </div>
    <div widget-area="sidebar" class="col-lg-3 col-sm-12"></div>
    <div widget-area="footer" class="col-sm-12 col-lg-12"></div>
  </div>
</div>
