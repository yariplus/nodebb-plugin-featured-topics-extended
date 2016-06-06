<div data-widget="featuredTopicsExCards">
  <div class="row featured-threads" itemscope itemtype="http://www.schema.org/ItemList">
    <!-- BEGIN topics -->
    <div component="categories/category" class="<!-- IF topics.category.class -->{topics.category.class}<!-- ELSE -->col-md-3 col-sm-6 col-xs-12<!-- ENDIF topics.category.class --> category-item" data-cid="{topics.category.cid}" data-numRecentReplies="{topics.category.numRecentReplies}">
      <meta itemprop="name" content="{topics.category.name}">

      <div class="category-icon" style="text-shadow:{textShadow};">
        <a style="color: {topics.category.color};" href="{config.relative_path}/topic/{topics.slug}" itemprop="url">
          <div
            id="category-{topics.category.cid}" class="category-header category-header-image-{topics.category.imageClass}"
            style="
              background-size: {backgroundSize};
              background-position: {backgroundPosition};
              color: {topics.category.color};
              opacity: {backgroundOpacity};
              <!-- IF topics.thumb -->background-image: url({topics.thumb});<!-- ELSE -->
                <!-- IF topics.category.backgroundImage -->background-image: url({topics.category.backgroundImage});<!-- ENDIF topics.category.backgroundImage -->
              <!-- ENDIF topics.thumb -->
              <!-- IF topics.category.bgColor -->background-color: {topics.category.bgColor};<!-- ENDIF topics.category.bgColor -->
            "></div>

            <div class="category-info" style="color: {topics.category.color};">
              <h4><!-- IF topics.category.icon --><i class="fa {topics.category.icon} visible-xs-inline"></i> <!-- ENDIF topics.category.icon -->{topics.title}</h4>
              <div class="description" itemprop="description"><strong>{topics.category.name}</strong> <span class="timeago" title="{topics.relativeTime}"></span></div>
            </div>
            <!-- IF topics.category.icon -->
            <div class="hidden-xs"><i class="fa {topics.category.icon} fa-4x hidden-xs"></i></div>
            <!-- ENDIF topics.category.icon -->

          <span class="post-count" style="color: {topics.category.color};">{topics.postcount}</span>
        </a>
      </div>
    </div>
    <!-- END topics -->
  </div>
</div>
