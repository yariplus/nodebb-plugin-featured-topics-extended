<div class="fte-theme-porta">
  <!-- BEGIN topics -->
  <div class="topic section sectionMain recentNews" tid="{topics.tid}">
    <div class="posts">
      <div class="primaryContent leftDate">

        <div class="subHeading">
          <div style="float: right; white-space: nowrap;">
            <a href="{config.relative_path}/topic/{topics.slug}">{topics.date.start}</a>
          </div>
          <a href="{config.relative_path}/topic/{topics.slug}" class="newsTitle">{topics.title}</a>
        </div>

        <div class="newsDate">
          <div class="newsMonth">{topics.date.month}</div>
          <div class="newsDay">{topics.date.date}</div>
        </div>

        <div class="user-img-container">
          <!-- IF topics.thumb -->
          <img src="{topics.thumb}" align="left" itemprop="image" />
          <!-- ELSE -->
            <a href="<!-- IF topics.user.userslug -->{config.relative_path}/user/{topics.user.userslug}<!-- ELSE -->#<!-- ENDIF topics.user.userslug -->">
            <!-- IF topics.user.picture -->
            <img component="user/picture" data-uid="{topics.user.uid}" src="{topics.user.picture}" align="left" itemprop="image" />
            <!-- ELSE -->
            <div component="user/picture" data-uid="{topics.user.uid}" class="user-icon" style="background-color: {topics.user.icon:bgColor};">{topics.user.icon:text}</div>
            <!-- ENDIF topics.user.picture -->
            <i component="user/status" class="fa fa-circle status {topics.user.status}" title="[[global:{topics.user.status}]]"></i>
            </a>
          <!-- ENDIF topics.thumb -->
        </div>

        <div class="messageContent">
          <div class="postedBy">
            <strong>
              <a href="<!-- IF topics.user.userslug -->{config.relative_path}/user/{topics.user.userslug}<!-- ELSE -->#<!-- ENDIF topics.user.userslug -->" itemprop="author" data-username="{topics.user.username}" data-uid="{topics.user.uid}">{topics.user.username}</a>
            </strong>

            <span class="views">({topics.viewcount} Views / {topics.post.votes} Upvotes)</span>
            <span class="comments">
              <div class="new"></div>
              <a href="{config.relative_path}/topic/{topics.slug}">{topics.replies} Replies <i class="fa fa-comment"></i></a>
            </span>
          </div>
          <div class="content newsText">{topics.post.content}</div>
          <div class="clearFix"></div>
        </div>

        <div class="sectionFooter">
          <a class="btn btn-default" href="{config.relative_path}/topic/{topics.slug}">
            <i class="fa fa-reply fa-rotate-180"></i> Continue reading...
          </a>
        </div>

      </div>
    </div>
  </div>

  <!-- IF !@last -->
  <div widget-area="contentbetween"></div>
  <!-- ENDIF !@last -->

  <!-- END topics -->

  <!-- IF paginator -->
  <div class="section sectionMain">
    <div class="PageNav">
      <nav>
        <!-- IF prevpage -->
        <a href="{config.relative_path}{featuredRoute}{prevpage}" class="btn btn-default">&lt; Previous Page</a>
        <!-- ENDIF prevpage -->

        <!-- BEGIN pages -->
        <a href="{config.relative_path}{featuredRoute}{pages.number}" class="btn <!-- IF pages.currentPage -->btn-primary<!-- ELSE -->btn-default<!-- ENDIF pages.currentPage -->">{pages.number}</a>
        <!-- END pages -->

        <!-- IF nextpage -->
        <a href="{config.relative_path}{featuredRoute}{nextpage}" class="btn btn-default">Next Page &gt;</a>
        <!-- ENDIF nextpage -->
      </nav>
    </div>
  </div>
  <!-- ENDIF paginator -->
</div>
