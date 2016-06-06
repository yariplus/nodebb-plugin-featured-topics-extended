<div data-widget="featuredTopicsExBlocks">
  <div class="row home featured-topics-ex-blocks" itemscope itemtype="http://www.schema.org/ItemList">
    <!-- BEGIN topics -->
    <div class="col-xs-3 col-xs-12 category-item" data-tid="{topics.tid}">
      <meta itemprop="name" content="{topics.title}">

      <div class="category-icon">
        <a style="color: {topics.category.color};" href="{config.relative_path}/topic/{topics.slug}" itemprop="url">
          <div class="category-header category-header-image-cover" style="color: {topics.category.color}; background-image: {topics.category.backgroundImage}; background-color: {topics.category.bgColor};">
            <span class="badge">{topics.postcount} </span>
            <!-- IF !topics.thumb -->
            <div><i class="fa {topics.category.icon} fa-4x"></i></div>
            <!-- ENDIF !topics.thumb -->
          </div>
        </a>

        <div class="category-box">
          <a href="{relative_path}/topic/{topics.slug}" itemprop="url">
            <h4><i class="fa {topics.category.icon} visible-xs-inline"></i> {topics.title}</h4>
          </a>
          <div class="description" itemprop="description">by {topics.user.username}</div>
          <!-- IMPORT widgets/featured-topics/posts.tpl -->
        </div>
      </div>
    </div>
    <!-- END topics -->
  </div>
</div>
