<div class="recent-replies">
	<ul>
		<!-- BEGIN topics -->
		<li data-tid="{topics.tid}" class="clearfix">

			<!-- IF topics.user.picture -->
			<img title="{topics.user.username}" class="avatar avatar-sm not-responsive" src="{topics.user.picture}" />
			<!-- ELSE -->
			<div class="avatar avatar-sm not-responsive" style="background-color: {topics.user.icon:bgColor};">{topics.user.icon:text}</div>
			<!-- ENDIF topics.user.picture -->

			<strong><a href="{relative_path}/topic/{topics.slug}">{topics.title}</a></strong>
			<br /><span>by {topics.user.username}</span><br />
			
			<span class="pull-right">posted <span class="timeago" title="{topics.relativeTime}"></span></span>
		</li>
		<!-- END topics -->
	</ul>
</div>
<script type="text/javascript">
$('span.timeago').timeago();
</script>
