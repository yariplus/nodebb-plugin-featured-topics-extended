<div class="row">
 <div widget-area="header" class="col-sm-12 col-lg-12"><!-- BEGIN widgets.header -->{{widgets.header.html}}<!-- END widgets.header --></div>
  <div class="<!-- IF widgets.sidebar.length -->col-lg-9 col-sm-12<!-- ELSE -->col-lg-12 col-sm-12<!-- ENDIF widgets.sidebar.length -->">
    <div class="row">
      <div widget-area="leftsidebar" class="col-lg-3 col-sm-12"><!-- BEGIN widgets.leftsidebar -->{widgets.leftsidebar.html}<!-- END widgets.leftsidebar --></div>
      <div class="<!-- IF widgets.leftsidebar.length -->col-lg-9 col-sm-12<!-- ELSE -->col-lg-12 col-sm-12<!-- ENDIF widgets.leftsidebar.length -->">
        <div widget-area="contenttop"><!-- BEGIN widgets.contenttop -->{widgets.contenttop.html}<!-- END widgets.contenttop --></div>
        <div class="fte-news">{featuredTemplate}</div>
        <div widget-area="contentbottom"><!-- BEGIN widgets.contentbottom -->{widgets.contentbottom.html}<!-- END widgets.contentbottom --></div>
      </div>
    </div>
  </div>
  <div widget-area="sidebar" class="col-lg-3 col-sm-12"><!-- BEGIN widgets.sidebar -->{widgets.sidebar.html}<!-- END widgets.sidebar --></div>
  <div widget-area="footer" class="col-sm-12 col-lg-12"><!-- BEGIN widgets.footer -->{widgets.footer.html}<!-- END widgets.footer --></div>
</div>
