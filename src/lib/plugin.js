// Featured Topics Extended

import async from 'async'
import winston from 'winston'
import tjs from 'templates.js'

const Topics = require.main.require('./src/topics')
const Posts = require.main.require('./src/posts')
const db = require.main.require('./src/database')
const translator = require.main.require('./public/src/modules/translator')
const nconf = require.main.require('nconf')
const Settings = require.main.require('./src/settings')
const User  = require.main.require('./src/user')
const SocketAdmin = require.main.require('./src/socket.io/admin')
const SocketPlugins = require.main.require('./src/socket.io/plugins')

const defaultSettings = {
  newsTemplate     : 'porta',
  newsHideAnon     : 0,
  customTemplate   : '',
  autoFeature      : '1'
}

let app, settings, autoFeature

// Hook static:app.load
// Setup routes and settings.
export function init (params, next) {
  app = params.app
  settings = new Settings('featured-topics-extended', '1.0.0', defaultSettings, readSettings)

  const router     = params.router
  const middleware = params.middleware

  router.get('/news',           middleware.buildHeader, render)
  router.get('/news/:page',     middleware.buildHeader, render)
  router.get('/api/news',       render)
  router.get('/api/news/:page', render)

  router.get('/admin/plugins/featured-topics-extended', middleware.admin.buildHeader, renderAdmin)
  router.get('/api/admin/plugins/featured-topics-extended', renderAdmin)

  function renderAdmin(req, res, next) {
    res.render('admin/plugins/featured-topics-extended', {})
  }

  SocketAdmin.settings.syncFeaturedTopicsExtended = () => {
    settings.sync(readSettings)
  }

  SocketPlugins.FeaturedTopicsExtended = {}

  SocketPlugins.FeaturedTopicsExtended.getUserFeaturedLists = (socket, data, next) => {
    getUserFeaturedLists(socket.uid, data.uid, next)
  }

  SocketPlugins.FeaturedTopicsExtended.getGlobalFeaturedLists = (socket, data, next) => {
    User.isAdminOrGlobalMod(socket.uid, (err, isAdminOrGlobalMod) => {
      if (err || !isAdminOrGlobalMod) return callback(err || new Error('[[error:no-privileges]]'))

      getGlobalFeaturedLists(next)
    })
  }

  SocketPlugins.FeaturedTopicsExtended.featureTopic = (socket, data, next) => {
    const isSelf = socket.uid === data.theirid

    User.isAdminOrGlobalMod(socket.uid, (err, isAdminOrGlobalMod) => {
      if (data.theirid) {
        if (!(isSelf || isAdminOrGlobalMod)) return next(new Error(`Cannot change another user's featured topics.`))
      } else {
        if (!isAdminOrGlobalMod) return callback(err || new Error('[[error:no-privileges]]'))
      }

      featureTopic(data.tid, data.theirid, data.list, next)
    })
  }

  function readSettings() {
    autoFeature = settings.get('autoFeature').split(',').map(cid => parseInt(cid, 10) || 0)
  }

  // Import News Page list. Depreciated. Remove in v1.0.0
  db.exists(`featuredex:tids`, (err, exists) => {
    if (err || !exists) return next()

    db.getSortedSetRangeByScore('featuredex:tids', 0, 100, 0, 100, (err, tids) => {
      if (err || !tids || !tids.length) {
        return next()
      }

      Topics.getTopicsFields(tids, ['tid', 'timestamp'], (err, topics) => {
        if (err || !topics) return next()

        db.sortedSetAdd(`featuredex:featured`, topics.length, `News Page`)

        async.each(topics, (topic, next) => {
          db.sortedSetAdd(`featuredex:featured:News Page:topics`, topic.timestamp, topic.tid, next)
        }, err => {
          if (err) return next()

          db.delete('featuredex:tids')
          next()
        })
      })
    })
  })
}

// Hook filter:homepage.get
// Add the news page as a selectable Homepage.
export function homepageGet (data, next) {
  data.routes.push({
    route: 'news',
    name: 'News'
  })

  next(null, data)
}

function featureTopic (tid, theirid, list, cb) {
  let listkey = theirid ? `uid:${theirid}:featured` : `featuredex:featured`
  let topicskey = theirid ? `uid:${theirid}:featured:${list}:topics` : `featuredex:featured:${list}:topics`

  db.isSortedSetMember(listkey, list, (err, isMember) => {
    if (err || !isMember) return cb(err || new Error(`List ${list} does not exist.`))

    Topics.getTopicField(tid, 'timestamp', (err, timestamp) => {
      if (err) return cb(err)

      db.sortedSetAdd(topicskey, timestamp, tid, cb)
    })
  })
}

// Get lists made by admins or global mods.
const getGlobalFeaturedLists = (cb) => {
  db.getSortedSetRangeByScore('featuredex:featured', 0, 1000, 0, '+inf', (err, lists) => {
    if (err || !lists) return cb(err)

    if (!lists.length) {
      createDefaultFeaturedList(0, (err) => {
        if (err) return cb(err)

        getGlobalFeaturedLists(cb)
      })
    } else {
      cb(null, lists)
    }
  })
}

// Get topics featured by admins or global mods.
function getFeaturedTopics (uid, list, page, size, cb) {
  page--

  db.getSortedSetRevRangeByScore(`featuredex:featured:${list}:topics`, page * size, page * size + size, '+inf', 0, (err, tids) => {
    if (err) return cb(err)

    getTopicsWithMainPost(uid, tids, (err, topicsData) => {
      if (err) return cb(err)

      cb(null, topicsData)
    })
  })
}

// Get user-featured lists.
const getUserFeaturedLists = (uid, theirid, cb) => {
  const isSelf = uid === theirid

  db.getSortedSetRangeByScore(`uid:${theirid}:featured`, 0, 1000, 0, '+inf', (err, lists) => {
    if (err || !lists) return cb(err)

    if (isSelf && !lists.length) {
      createDefaultFeaturedList(theirid, (err) => {
        if (err) return cb(err)

        getUserFeaturedLists(uid, theirid, cb)
      })
    } else {
      cb(null, lists)
    }
  })
}

// Get user-featured topics.
function getUserFeaturedTopics (uid, theirid, list, page, size, cb) {
  db.getSortedSetRevRangeByScore(`uid:${theirid}:featured:${list}:topics`, page * size, page * size + size, '+inf', 0, (err, tids) => {
    if (err) return cb(err)

    getTopicsWithMainPost(uid, tids, (err, topicsData) => {
      if (err) return cb(err)

      cb(null, topicsData)
    })
  })
}

// Create a blank default list.
function createDefaultFeaturedList (theirid, next) {
  db.sortedSetAdd(theirid ? `uid:${theirid}:featured` : `featuredex:featured`, Date.now(), 'Default List', next)
}

// Filter an array of topics and add the main post.
function getTopicsWithMainPost (uid, tids, cb) {
  Topics.getTopics(tids, uid, (err, topicsData) => {
    if (err) return cb(err)

    topicsData = topicsData.filter(topic => !topic.deleted)

    async.forEachOf(topicsData, (topicData, i, next) => {
      Topics.getMainPost(topicData.tid, uid, (err, mainPost) => {
        topicsData[i].post = mainPost
        next()
      })
    }, () => {
      cb(null, topicsData)
    })
  })
}

// Hook filter:widgets.getAreas
// Add a widget areas for the news page.
export function getAreas (areas, cb) {
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

  cb(null, areas)
}

// Hook filter:widgets.getWidgets
export function getWidgets (widgets, callback) {
  const _widgets = [
    {
      widget: 'featuredTopicsExSidebar',
      name: 'Featured Topics Sidebar',
      description: 'Featured topics as a sidebar widget.',
      content: '<small>Use the Topic Tools on a topic page to feature that topic.</small>'
    },
    {
      widget: 'featuredTopicsExBlocks',
      name: 'Featured Topics Blocks',
      description: 'Featured topics as Lavender-style blocks.',
      content: '<small>Use the Topic Tools on a topic page to feature that topic.</small>'
    },
    {
      widget: 'featuredTopicsExCards',
      name: 'Featured Topics Cards',
      description: 'Featured topics as Persona-style topic cards.',
      content: 'admin/widgets/featured-topics-ex-cards.tpl'
    },
    {
      widget: 'featuredTopicsExList',
      name: 'Featured Topics List',
      description: 'Featured topics as a normal topic list.',
      content: '<small>Use the Topic Tools on a topic page to feature that topic.</small>'
    }
  ]

  async.each(_widgets, (widget, next) => {
    if (!widget.content.match('tpl')) return next()
    app.render(widget.content, {}, (err, content) => {
      translator.translate(content, content => {
        widget.content = content
        next()
      })
    })
  }, err => {
    widgets = widgets.concat(_widgets)
    callback(null, widgets)
  })
}

// Hook filter:widget.render:featuredTopicsExSidebar
export function renderFeaturedTopicsSidebar (widget, callback) {
  getFeaturedTopics(widget.uid, 'Default List', 1, 5, (err, featuredTopics) => {
    app.render('widgets/featured-topics-ex-sidebar', {topics: featuredTopics}, callback)
  })
}

// Hook filter:widget.render:featuredTopicsExBlocks
export function renderFeaturedTopicsBlocks (widget, callback) {
  getFeaturedTopics(widget.uid, 'Default List', 1, 5, (err, featuredTopics) => {
    app.render('widgets/featured-topics-ex-blocks', {topics: featuredTopics}, callback)
  })
}

// Hook filter:widget.render:featuredTopicsExCards
export function renderFeaturedTopicsCards (widget, callback) {
  getFeaturedTopics(widget.uid, 'Default List', 1, 5, (err, featuredTopics) => {
    async.each(featuredTopics, (topic, next) => {
      Topics.getTopicPosts(topic.tid, `tid:${topic.tid}:posts`, 0, 4, widget.uid, true, (err, posts) => {
        topic.posts = posts
        next(err)
      })
    }, err => {
      widget.data.topics = featuredTopics
      widget.data.backgroundSize = widget.data.backgroundSize || 'cover'
      widget.data.backgroundPosition = widget.data.backgroundPosition || 'center'
      widget.data.backgroundOpacity = widget.data.backgroundOpacity || '1.0'
      widget.data.textShadow = widget.data.textShadow || 'none'
      app.render('widgets/featured-topics-ex-cards', widget.data, callback)
    })

  })
}

// Hook filter:widget.render:featuredTopicsExList
export function renderFeaturedTopicsList (widget, callback) {
  getFeaturedTopics(widget.uid, 'Default List', 1, 5, (err, featuredTopics) => {
    async.each(featuredTopics, (topic, next) => {
      Topics.getTopicPosts(topic.tid, `tid:${topic.tid}:posts`, 0, 4, widget.uid, true, (err, posts) => {
        topic.posts = posts
        next(err)
      })
    }, err => {
      app.render('widgets/featured-topics-ex-list', {topics:featuredTopics}, (err, html) => {
        translator.translate(html, translatedHTML => {
          callback(err, translatedHTML)
        })
      })
    })

  })
}

// Hook filter:widget.render:featuredTopicsExNews
// TODO
export function renderFeaturedTopicsNews (widget, callback) {
  getFeaturedTopics(widget.uid, 'Default List', 1, 5, (err, featuredTopics) => {
    app.render('news', {}, (err, html) => {
      translator.translate(html, translatedHTML => {
        callback(err, translatedHTML)
      })
    })
  })
}

// Hook action:homepage.get:news
// Pass hook data to the render function.
export function newsRender (data) {
  render(data.req, data.res, data.next)
}

// Hook filter:navigation.available
// Adds an available nav icon to admin page.
export function addNavs (items, cb) {
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
export function adminBuild (header, cb) {
  header.plugins.push({
    route : '/plugins/featured-topics-extended',
    icon  : 'fa-newspaper-o',
    name  : 'Featured Topics Extended'
  })
  cb(null, header)
}

// Hook filter:topic.thread_tools
// Adds the 'Feature this Topic' link to the 'Topic Tools' menu.
export function addThreadTools (data, callback) {
  data.tools.push({
    title: 'Feature this Topic',
    class: 'mark-featured',
    icon: 'fa-star'
  })

  callback(null, data)
}

// Hook filter:post.tools
// Adds user thread feature link.
export function addPostTools (data, callback) {
  Posts.isMain(data.pid, (err, isMain) => {
    if (err) {
      return callback(err)
    }

    if (isMain) {
      data.tools.push({
        action: 'mark-featured',
        html: 'Feature this Topic',
        icon: 'fa-star'
      })
    }

    callback(null, data)
  })
}

// Hook action:topic.post
// Auto-feature topics in the selected categories.
export function topicPost (topicData) {
}

// Date parsing helper.
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const days   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
function getDate(timestamp){
  let date = new Date(parseInt(timestamp, 10))
  const hours = date.getHours()
  date = {
    full  : `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
    year  : date.getFullYear(),
    month : months[date.getMonth()],
    date  : date.getDate(),
    day   : days[date.getDay()],
    mer   : hours >= 12 ? 'PM' : 'AM',
    hour  : hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours),
    min   : date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes(),
    sec   : date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()
  }
  date.start = (Date.now() - parseInt(timestamp, 10))/1000 < 604800 ? `${date.day} at ${date.hour}:${date.min} ${date.mer}` : date.full
  return date
}

// Render the news.
function render(req, res, next) {
  const payload       = {config: {relative_path: nconf.get('relative_path')}}
  const topicsPerPage = 5
  const topicIndex    = 0
  const uid = req.uid

  if (!uid && settings.get('newsHideAnon')) return res.render('news', payload)

  async.waterfall([
    async.apply(getFeaturedTopics, uid, 'Default List', 1, 5),
    (topicsData, next) => {
      const topicCount  = topicsData.length
      const pageCount   = Math.max(1, Math.ceil(topicCount / topicsPerPage))
      let currentPage = parseInt(req.params.page, 10) || 1

      if (currentPage < 1 || currentPage > pageCount) {
        currentPage = 1
      }

      payload.nextpage = currentPage === pageCount ? false : currentPage + 1
      payload.prevpage = currentPage === 1 ? false : currentPage - 1

      payload.pages = []
      for (let number = 1; number <= pageCount; number++) {
        const _page = {number}
        if (number === currentPage) _page.currentPage = true
        payload.pages.push(_page)
      }

      payload.topics = []

      const tids = []
      for (let i = 0; i < topicsPerPage; i++) {
        const x = (currentPage - 1)*5+i
        if (topicsData[x]) {
          payload.topics.push(topicsData[x])
        }
      }

      if (currentPage === 1 && topicsData[0]) {
        Topics.increaseViewCount(topicsData[0].tid)
      }

      payload.topics.forEach(topic => {
        topic.date = getDate(topic.timestamp)
        topic.replies = topic.postcount - 1
      })

      payload.topics.sort(function compare(a, b) {
        if (a.timestamp > b.timestamp) {
          return -1
        }
        if (a.timestamp < b.timestamp) {
          return 1
        }
        return 0
      })
      next()
    }
  ], err => {
    if (err) winston.error('Error parsing news page:', err ? (err.message || err) : 'null')

    const template = settings.get('newsTemplate') || defaultSettings['newsTemplate']

    if (template !== 'custom') {
      app.render(`news-${template}`, payload, (err, html) => {
        translator.translate(html, translatedHTML => {
          payload.newsTemplate = translatedHTML
          res.render('news', res.locals.isAPI ? payload : {newsTemplate: translatedHTML})
        })
      })
    }else{
      const parsed = tjs.parse(settings.get('customTemplate'), payload)
      translator.translate(parsed, translatedHTML => {
        translatedHTML = translatedHTML.replace('&#123;', '{').replace('&#125;', '}')
        payload.newsTemplate = translatedHTML
        res.render('news', res.locals.isAPI ? payload : {newsTemplate: translatedHTML})
      })
    }
  })
}
