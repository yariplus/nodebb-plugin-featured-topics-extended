// Featured Topics Extended

// NodeBB modules
const Posts = require.main.require('./src/posts')
const db = require.main.require('./src/database')
const translator = require.main.require('./public/src/modules/translator')
const SocketAdmin = require.main.require('./src/socket.io/admin')
const SocketPlugins = require.main.require('./src/socket.io/plugins')

// Includes
const controllers = require('./controllers')
const featured = require('./featured')
const routes = require('./routes')
const settings = require('./settings')
const sockets = require('./sockets')
const widgets = require('./widgets')

let app

// Hook static:app.load
// Setup routes and settings.
// TODO: Eliminate global app.
exports.init = async ({app: _app, router, middleware}) => {
  app = _app

  settings.setup()
  routes.setup({router, middleware})

  SocketAdmin.settings.syncFeaturedTopicsExtended = () => {
    settings.sync()
  }

  SocketPlugins.FeaturedTopicsExtended = sockets

  // Import News Page list. Depreciated. Remove in v1.0.0
  if (await db.exists(`featuredex:tids`)) {
    let tids = await db.getSortedSetRangeByScore('featuredex:tids', 0, 10000, 0, '+inf')

    createList(0, 'News', async err => {
      if (err) return

      for (const tid of tids) {
        await featureTopic(0, tid, 'News', () => {})
      }

      if (settings.get('autoFeature')) {
        setAutoFeature(0, 'news', settings.get('autoFeature').replace(/ /g, '').split(',').map(cid => parseInt(cid, 10)).filter(cid => cid), () => {})
      }

      db.delete('featuredex:tids')
    })
  }

  let debug = false
  if (debug) {
    let keys = await db.scan({match: 'fte*'})
    for (let i in keys) {
      keys[i] = keys[i] + ' = ' + await db.type(keys[i])
    }
    console.dir(keys)
  }
}

// Hook filter:homepage.get
// Add the news page as a selectable Homepage.
exports.homepageGet = async (data) => {
  data.routes.push({route: 'news', name: 'News'})

  return data
}

// Hook filter:widgets.getAreas
// Add a widget areas for the news page.
exports.getAreas = async (areas) => {
  areas = areas.concat([
    {
      name     : 'News Header',
      template : 'news.tpl',
      location : 'header'
    },
    {
      name     : 'News Sidebar',
      template : 'news.tpl',
      location : 'sidebar'
    },
    {
      name     : 'News Left Sidebar',
      template : 'news.tpl',
      location : 'leftsidebar'
    },
    {
      name     : 'News Footer',
      template : 'news.tpl',
      location : 'footer'
    },
    {
      name     : 'News Content Top',
      template : 'news.tpl',
      location : 'contenttop'
    },
    {
      name     : 'News Content Bottom',
      template : 'news.tpl',
      location : 'contentbottom'
    },
    {
      name     : 'News Content Between',
      template : 'news.tpl',
      location : 'contentbetween'
    }
  ])

  return areas
}

// Hook filter:widgets.getWidgets
exports.getWidgets = async (widgets) => {
  const render = async (template) => {
    let html = await app.renderAsync(template)

    html = await translator.translate(html)

    return html
  }

  widgets = widgets.concat([
    {
      widget: 'featuredTopicsExSidebar',
      name: 'Featured Topics Sidebar',
      description: 'Featured topics as a sidebar widget.',
      content: await render('admin/widgets/fte-widget.tpl')
    },
    {
      widget: 'featuredTopicsExBlocks',
      name: 'Featured Topics Blocks',
      description: 'Featured topics as Lavender-style blocks.',
      content: await render('admin/widgets/fte-widget.tpl')
    },
    {
      widget: 'featuredTopicsExCards',
      name: 'Featured Topics Cards',
      description: 'Featured topics as Persona-style topic cards.',
      content: await render('admin/widgets/fte-widget-cards.tpl')
    },
    {
      widget: 'featuredTopicsExList',
      name: 'Featured Topics List',
      description: 'Featured topics as a normal topic list.',
      content: await render('admin/widgets/fte-widget.tpl')
    },
    {
      widget: 'featuredTopicsExNews',
      name: 'Featured Topics News',
      description: 'Featured topics as a News/Blog page.',
      content: await render('admin/widgets/fte-widget-news.tpl')
    }
  ])

  return widgets
}

// Hook action:homepage.get:news
// Pass hook data to the render function.
exports.newsRender = ({req, res}) => {
  controllers.renderNewsPage(req, res)
}

// Hook filter:navigation.available
// Adds an available nav icon to admin page.
exports.addNavs = (items, cb) => {
  items.push({
    route     : '/news',
    title     : 'News',
    enabled   : false,
    iconClass : 'fa-newspaper-o',
    textClass : 'visible-xs-inline',
    text      : 'News'
  })
  cb(null, items)
}

// Hook filter:admin.header.build
// Adds a link to the plugin settings page to the ACP Plugins menu.
exports.adminBuild = (header, cb) => {
  header.plugins.push({
    route : '/plugins/featured-topics-extended',
    icon  : 'fa-newspaper-o',
    name  : 'Featured Topics Extended'
  })
  cb(null, header)
}

// Hook filter:topic.thread_tools
// Adds the 'Feature this Topic' link to the 'Topic Tools' menu.
exports.addThreadTools = (data, callback) => {
  data.tools.push({
    title: 'Feature this Topic',
    class: 'mark-featured',
    icon: 'fa-star'
  })

  callback(null, data)
}

// Hook filter:post.tools
// Adds user thread feature link.
exports.addPostTools = async (post) => {
  const isMain = await Posts.isMain(post.pid)

  if (isMain) {
    post.tools.push({
      action: 'mark-featured',
      html: 'Feature this Topic',
      icon: 'fa-star'
    })
  }

  return post
}

// Hook action:topic.post
// Auto-feature topics in the selected categories.
exports.topicPost = async (hookData) => {
  const {tid, cid} = hookData.topic

  const autoFeaturedData = await db.getSortedSetRange(`fte:autofeature:${cid}`, 0, -1)

  for (let listData of autoFeaturedData) {
    listData = listData.split(':')

    if (listData.length !== 2) return // TODO: Handle errors.

    const theirid = listData[0]
    const list = listData[1]

    featured.featureTopic(theirid, tid, list)
  }
}

// Hook action:topic.delete
// Auto-feature topics in the selected categories.
exports.topicDelete = async (hookData) => {
  const {tid} = hookData.topic

  let data = await db.getSortedSetRange(`tid:${tid}:featured`, 0, -1)

  // TODO: asyncify
  for (const datum in data) {
    datum = datum.split(':')

    if (datum.length !== 2) continue // TODO: Error check.

    const theirid = datum[0]
    const list = datum[1]

    await unfeatureTopic(theirid, tid, list)
  }
}

// Hook filter:user.profileMenu
// Add links to private list management and public blog.
exports.userProfileMenu = async (data) => {
  data.links = data.links.concat([
    {
      name: '[[fte:featuredtopics]]',
      id: 'fte-profilelink-featured',
      visibility: {
        self: true,
        other: false,
        moderator: false,
        globalMod: false,
        admin: false,
      },
      route: 'featured',
      icon: 'fa-newspaper-o'
    },
    {
      name: '[[fte:blog]]',
      id: 'fte-profilelink-blog',
      route: 'blog',
      icon: 'fa-newspaper-o'
    }
  ])

  return data
}

// filter:admin/extend/widgets.build
exports.buildWidgets = async (data) => {
  let lists = await featured.getFeaturedTopicsLists(data.req.uid, 0)

  data.templateData.lists = lists

  return data
}

exports.renderFeaturedTopicsSidebar = widgets.renderFeaturedTopicsSidebar
exports.renderFeaturedTopicsBlocks = widgets.renderFeaturedTopicsBlocks
exports.renderFeaturedTopicsCards = widgets.renderFeaturedTopicsCards
exports.renderFeaturedTopicsList = widgets.renderFeaturedTopicsList
exports.renderFeaturedTopicsNews = widgets.renderFeaturedTopicsNews
