// widgets.js

const featured = require('./featured')
const controllers = require('./controllers')

const nconf = require.main.require('nconf')
const Topics = require.main.require('./src/topics')

// Hook filter:widget.render:featuredTopicsExSidebar
exports.renderFeaturedTopicsSidebar = async (widget) => {
  const renderWidgetTopics = await getRenderWidgetTopics('widgets/featured-topics-ex-sidebar', widget)

  const topics = await getWidgetTopics(widget)

  widget.html = await renderWidgetTopics(topics)

  return widget
}

// Hook filter:widget.render:featuredTopicsExBlocks
exports.renderFeaturedTopicsBlocks = async (widget) => {
  const renderWidgetTopics = await getRenderWidgetTopics('widgets/featured-topics-ex-blocks', widget)

  const topics = await getWidgetTopics(widget)

  widget.html = await renderWidgetTopics(topics)

  return widget
}

// Hook filter:widget.render:featuredTopicsExCards
exports.renderFeaturedTopicsCards = async (widget) => {
  let templateData = {
    backgroundSize: widget.data.backgroundSize || 'cover',
    backgroundPosition: widget.data.backgroundPosition || 'center',
    backgroundOpacity: widget.data.backgroundOpacity || '1.0',
    textShadow: widget.data.textShadow || 'none',
  }
  widget.data = {...widget.data, ...templateData}

  const renderWidgetTopics = await getRenderWidgetTopics('widgets/featured-topics-ex-cards', widget)

  let topics = await getWidgetTopics(widget)

  for (let i in topics) {
    const {tid} = topics[i]

    topics[i].posts = await Topics.getTopicPosts(tid, `tid:${tid}:posts`, 0, 4, widget.uid, true)
  }

  widget.html = await renderWidgetTopics(topics)

  return widget
}

// Hook filter:widget.render:featuredTopicsExList
exports.renderFeaturedTopicsList = async (widget, next) => {
  const renderWidgetTopics = await getRenderWidgetTopics('widgets/featured-topics-ex-list', widget)

  let topics = await getWidgetTopics(widget)

  for (let i in topics) {
    const {tid} = topics[i]

    topics[i].posts = await Topics.getTopicPosts(tid, `tid:${tid}:posts`, 0, 4, widget.uid, true)
  }

  widget.html = await renderWidgetTopics(topics)

  return widget
}

// Hook filter:widget.render:featuredTopicsExNews
// TODO
exports.renderFeaturedTopicsNews = async (widget) => {
  const {slug, sorted, max, sortby, template} = widget.data
  const {uid} = widget

  let topics
  if (sorted) {
    const tids = sorted.replace(/ /g, '').split(',').map(i => parseInt(i, 10))
    topics = await featured.getTopicsWithMainPost(uid, tids)
  } else {
    topics = await featured.getFeaturedTopicsBySlug(uid, 0, slug, 1, max)
  }

  let data = await controllers.parseFeaturedPageTopics(template, topics, 1, false, false, false, {req: widget.req})
  widget.html = data.featuredTemplate

  return widget
}

async function getWidgetTopics (widget) {
  const {slug, sorted, max} = widget.data
  const {uid} = widget

  if (sorted) {
    const tids = sorted.replace(/ /g, '').split(',').map(i => parseInt(i, 10))
    return await featured.getTopicsWithMainPost(uid, tids)
  } else {
    return await featured.getFeaturedTopicsBySlug(uid, 0, slug, 1, max)
  }
}

async function getRenderWidgetTopics (template, widget) {
  let renderWidgetTopics = async (topics) => {
    widget.data.topics = topics
    widget.data.config = {relative_path: nconf.get('relative_path')}

    return await widget.req.app.renderAsync(template, widget.data)
  }

  return renderWidgetTopics
}
