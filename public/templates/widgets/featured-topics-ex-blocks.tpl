
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
<br/>

<script type="text/javascript">
(function() {
	$('span.timeago').timeago();

	var featuredThreadsWidget = app.widgets.featuredThreads;

	var numPosts = parseInt('{numPostsPerTopic}', 10); // TODO replace with setting from widget
	numPosts = numPosts || 8;

	if (!featuredThreadsWidget) {
		featuredThreadsWidget = {};
		featuredThreadsWidget.onNewPost = function(data) {
			var tid;
			if(data && data.posts && data.posts.length) {
				tid = data.posts[0].tid;
			}

			var category = $('.home .category-item[data-tid="' + tid + '"]');
			var recentPosts = category.find('.post-preview');
			var insertBefore =  recentPosts.first();

			if (!insertBefore.length) {
				return;
			}

			parseAndTranslate(data.posts, function(html) {
				html.hide()
					.insertBefore(insertBefore)
					.fadeIn();

				app.createUserTooltips();
				if (category.find('.post-preview').length > numPosts) {
					recentPosts.last().remove();
				}
			});
		}

		app.widgets.featuredThreads = featuredThreadsWidget;
		socket.on('event:new_post', app.widgets.featuredThreads.onNewPost);
	}

	function parseAndTranslate(posts, callback) {
		templates.preload_template('widgets/featured-topics/posts', function() {
			var html = templates['widgets/featured-topics/posts'].parse({
				topics: {
					posts: posts
				}
			});

			translator.translate(html, function(translatedHTML) {
				translatedHTML = $(translatedHTML);
				translatedHTML.find('img').addClass('img-responsive');
				translatedHTML.find('span.timeago').timeago();
				callback(translatedHTML);
			});
		});
	}
}());

</script>
