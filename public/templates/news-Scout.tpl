<div class="row scout">
<br>
<!-- BEGIN topics -->
<div class="col-xs-6 col-sm-4" tid="{topics.tid}" class="post-holder">
  <a href="{config.relative_path}/topic/{topics.slug}" class="post-box" style="min-height: 340px;">
    <figure style="background: {topics.user.icon:bgColor}
      <!-- IF topics.imageurl -->
        url({topics.imageurl})
      <!-- END topics.imageurl -->
      ;background-size: cover;height:180px;">     
    </figure>
    <p style="background: #f6f6f6;
    border: 1px solid #ececec;
    border-radius: 0 0 4px 4px;
    border-top: 0;
    color: #333;
    font-size: 15px;
    padding: 20px 25px;
    line-height: 1.5em;
    min-height: 50px;
    text-align: center;
    transition: all .2s ease-in-out;"><span class="category"><em>{topics.category.name}</em></span><br>{topics.title}</p>
  </a>
</div>
<!-- END topics -->
</div>
