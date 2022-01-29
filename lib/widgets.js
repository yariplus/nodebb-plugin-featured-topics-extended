// widgets.js

const featured = require('./featured')

const async = require.main.require('async')
const nconf = require.main.require('nconf')

const translator = require.main.require('./public/src/modules/translator')

// Hook filter:widget.render:featuredTopicsExSidebar
exports.renderFeaturedTopicsSidebar = (widget, next) => {
  const {slug, sorted, max, sortby} = widget.data
  const {uid} = widget

  const render = renderWidgetTopics('widgets/featured-topics-ex-sidebar', {}, widget, next)

  if (sorted) {
    const tids = sorted.replace(/ /g, '').split(',').map(i => parseInt(i, 10))
    featured.getTopicsWithMainPost(uid, tids, render)
  } else {
    featured.getFeaturedTopicsBySlug(uid, 0, slug, 1, max, render)
  }
}

// Hook filter:widget.render:featuredTopicsExBlocks
exports.renderFeaturedTopicsBlocks = (widget, next) => {
  const {slug, sorted, max, sortby} = widget.data
  const {uid} = widget

  const render = renderWidgetTopics('widgets/featured-topics-ex-blocks', {}, widget, next)

  if (sorted) {
    const tids = sorted.replace(/ /g, '').split(',').map(i => parseInt(i, 10))
    featured.getTopicsWithMainPost(uid, tids, render)
  } else {
    featured.getFeaturedTopicsBySlug(uid, 0, slug, 1, max, render)
  }
}

// Hook filter:widget.render:featuredTopicsExCards
exports.renderFeaturedTopicsCards = (widget, next) => {
  const {slug, sorted, max, sortby} = widget.data
  const {uid} = widget

  const render = renderWidgetTopics('widgets/featured-topics-ex-cards', {
    backgroundSize: widget.data.backgroundSize || 'cover',
    backgroundPosition: widget.data.backgroundPosition || 'center',
    backgroundOpacity: widget.data.backgroundOpacity || '1.0',
    textShadow: widget.data.textShadow || 'none',
  }, widget, next)

  const getPosts = (topics, next) => {
    async.each(topics, (topic, next) => {
      const {tid} = topic

      Topics.getTopicPosts(tid, `tid:${tid}:posts`, 0, 4, uid, true, (err, posts) => {
        topic.posts = posts
        next(err)
      })
    }, err => next(err, topics))
  }

  if (sorted) {
    const tids = sorted.replace(/ /g, '').split(',').map(i => parseInt(i, 10))
    featured.getTopicsWithMainPost(uid, tids, (err, topics) => {
      if (err) return render(err)
      getPosts(topics, render)
    })
  } else {
    featured.getFeaturedTopicsBySlug(uid, 0, slug, 1, max, (err, topics) => {
      if (err) return render(err)
      getPosts(topics, render)
    })
  }
}

// Hook filter:widget.render:featuredTopicsExList
exports.renderFeaturedTopicsList = (widget, next) => {
  const {slug, sorted, max, sortby} = widget.data
  const {uid} = widget

  const render = renderWidgetTopics('widgets/featured-topics-ex-list', {}, widget, next)

  const getPosts = (topics, next) => {
    async.each(topics, (topic, next) => {
      const {tid} = topic

      Topics.getTopicPosts(tid, `tid:${tid}:posts`, 0, 4, uid, true, (err, posts) => {
        topic.posts = posts
        next(err)
      })
    }, err => next(err, topics))
  }

  if (sorted) {
    const tids = sorted.replace(/ /g, '').split(',').map(i => parseInt(i, 10))
    featured.getTopicsWithMainPost(uid, tids, (err, topics) => {
      if (err) return render(err)
      getPosts(topics, render)
    })
  } else {
    featured.getFeaturedTopicsBySlug(uid, 0, slug, 1, max, (err, topics) => {
      if (err) return render(err)
      getPosts(topics, render)
    })
  }
}

// Hook filter:widget.render:featuredTopicsExNews
exports.renderFeaturedTopicsNews = (widget, next) => {
  const {slug, sorted, max, sortby, template} = widget.data
  const {uid} = widget

  if (sorted) {
    const tids = sorted.replace(/ /g, '').split(',').map(i => parseInt(i, 10))
    featured.getTopicsWithMainPost(uid, tids, render)
  } else {
    featured.getFeaturedTopicsBySlug(uid, 0, slug, 1, max, render)
  }

  function render (err, topics) {
    parseFeaturedPageTopics(template, topics, 1, false, false, false, {}, (err, data) => {
      widget.html = data.featuredTemplate
      next(null, widget)
    })
  }
}

// TODO: a lot of repeatition here that could be improved.
function renderWidgetTopics (template, data, widget, next) {
  return (err, topics) => {
    if (err) {
      widget.html = ''
      return next(null, widget)
    }

    data.topics = topics
    data.config = {relative_path: nconf.get('relative_path')}

    widget.req.app.render(template, data, (err, html) => translator.translate(html, html => {
      widget.html = html
      next(err, widget)
    }))
  }
}
