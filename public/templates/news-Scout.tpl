<div class="row fte-theme-scout">
<br>
<!-- BEGIN topics -->
<div class="col-xs-6 col-sm-4" tid="{topics.tid}">
  <a href="{config.relative_path}/topic/{topics.slug}" class="scout-container">
    <figure class="scout-figure" style="background-color: {topics.user.icon:bgColor};
      <!-- IF topics.imageurl -->
        background-image: url({topics.imageurl});
      <!-- END topics.imageurl -->
      ">
    </figure>
    <div class="scout-text">
      <span class="scout-category"><em>{topics.category.name}</em></span>
      <span class="scout-title">{topics.title}</span>
    </div>
  </a>
</div>
<!-- END topics -->
</div>
