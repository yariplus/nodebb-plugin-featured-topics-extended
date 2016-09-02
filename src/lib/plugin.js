// Featured Topics Extended

import async from 'async'
import winston from 'winston'
import tjs from 'templates.js'

const categories = require.main.require('./src/categories')
const topics = require.main.require('./src/topics')
const db = require.main.require('./src/database')
const translator = require.main.require('./public/src/modules/translator')
const nconf = require.main.require('nconf')
const Settings = require.main.require('./src/settings')
const SocketTopics = require.main.require('./src/socket.io/topics')
const SocketAdmin  = require.main.require('./src/socket.io/admin')

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

  SocketAdmin.getFeaturedTopics = (socket, data, callback) => {
    getFeaturedTopics(socket.uid, data, callback)
  }

  SocketAdmin.setFeaturedTopics = (socket, data, next) => {
    setFeaturedTopics(data, next)
  }

  function readSettings() {
    autoFeature = settings.get('autoFeature').split(',').map(cid => parseInt(cid, 10) || 0)
  }

  next()
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

// Get featured topics, possibly adding a new one.
function getFeaturedTopics(uid, data={}, cb) {
  db.getSortedSetRangeByScore('featuredex:tids', 0, 100, 0, 100, (err, tids) => {
    if (data.tid) {
      if (tids.indexOf(data.tid) === -1) {
        db.sortedSetAdd('featuredex:tids', 0, data.tid, () => {})
        tids.unshift(data.tid)
      }
    }

    topics.getTopicsByTids(tids, uid, (err, topicsData) => {
      if (err) return cb(err, topicsData)

      async.forEachOf(topicsData, (topicData, i, next) => {
        topics.getMainPost(topicData.tid, uid, (err, mainPost) => {
          topicsData[i].post = mainPost
          next()
        })
      }, () => {
        cb(err, topicsData)
      })
    })
  })
}

function setFeaturedTopics(data, cb) {
  db.delete('featuredex:tids', err => {
    const scores = []
    const values = []
    data.tids.forEach((tid, i) => {
      scores.push(i)
      values.push(tid)
    })

    db.sortedSetAdd('featuredex:tids', scores, values, cb)
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

// ?
function getTemplateData(uid, data, done) {
  const templateData = { }

  getFeaturedTopics(uid, data, (err, featuredTopics) => {
    templateData.topics = featuredTopics
    done(null, templateData)
  })
}

// Hook filter:widget.render:featuredTopicsExSidebar
export function renderFeaturedTopicsSidebar (widget, callback) {
  getTemplateData(widget.uid, null, (err, templateData) => {
    app.render('widgets/featured-topics-ex-sidebar', templateData, callback)
  })
}

// Hook filter:widget.render:featuredTopicsExBlocks
export function renderFeaturedTopicsBlocks (widget, callback) {
  getTemplateData(widget.uid, null, (err, templateData) => {
    app.render('widgets/featured-topics-ex-blocks', templateData, callback)
  })
}

// Hook filter:widget.render:featuredTopicsExCards
export function renderFeaturedTopicsCards (widget, callback) {
  getFeaturedTopics(widget.uid, null, (err, featuredTopics) => {
    async.each(featuredTopics, (topic, next) => {
      topics.getTopicPosts(topic.tid, `tid:${topic.tid}:posts`, 0, 4, widget.uid, true, (err, posts) => {
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
  getFeaturedTopics(widget.uid, null, (err, featuredTopics) => {
    async.each(featuredTopics, (topic, next) => {
      topics.getTopicPosts(topic.tid, `tid:${topic.tid}:posts`, 0, 4, widget.uid, true, (err, posts) => {
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
export function renderFeaturedTopicsNews (widget, callback) {
  getFeaturedTopics(widget.uid, null, (err, featuredTopics) => {
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

// Hook action:topic.post
// Auto-feature topics in the selected categories.
export function topicPost (topicData) {
  if (autoFeature.indexOf(parseInt(topicData.cid, 10)) !== -1) {
    getFeaturedTopics(-1, {tid: topicData.tid}, (err, topicsData) => {
      if (err) return
      const tids = topicsData.map(topic => topic.tid)
      setFeaturedTopics({tids}, () => {})
    })
  }
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
    async.apply(getFeaturedTopics, uid, {}),
    (topicsData, next) => {
      topicsData = topicsData.filter(topic => !topic.deleted)

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
        topics.increaseViewCount(topicsData[0].tid)
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
