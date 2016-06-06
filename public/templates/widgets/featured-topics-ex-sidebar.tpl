<div data-widget="featuredTopicsExSidebar">
	<ul>
		<!-- BEGIN topics -->
		<li data-tid="{topics.tid}" class="clearfix">

      <!-- IF topics.thumb -->
        <a href="{config.relative_path}/topic/{topics.slug}">
          <img title="{topics.title}" class="avatar avatar-sm not-responsive" src="{topics.thumb}">
        </a>
      <!-- ELSE -->
        <a href="<!-- IF topics.user.userslug -->{config.relative_path}/user/{topics.user.userslug}<!-- ELSE -->#<!-- ENDIF topics.user.userslug -->">
          <!-- IF topics.user.picture -->
          <img title="{topics.user.username}" class="avatar avatar-sm not-responsive" src="{topics.user.picture}" />
          <!-- ELSE -->
          <div title="{topics.user.username}" class="avatar avatar-sm not-responsive" style="background-color: {topics.user.icon:bgColor};">{topics.user.icon:text}</div>
          <!-- ENDIF topics.user.picture -->
        </a>
      <!-- ENDIF topics.thumb -->
			<strong><a href="{config.relative_path}/topic/{topics.slug}">{topics.title}</a></strong>
			<br>
      <span>by <a href="<!-- IF topics.user.userslug -->{config.relative_path}/user/{topics.user.userslug}<!-- ELSE -->#<!-- ENDIF topics.user.userslug -->">{topics.user.username}</a></span>
      <br>
			<span class="pull-right">posted <a href="{config.relative_path}/topic/{topics.slug}"><span class="timeago" title="{topics.timestampISO}"></span></a></span>
		</li>
		<!-- END topics -->
	</ul>
</div>
