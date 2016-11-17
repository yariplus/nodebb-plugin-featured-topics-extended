// Featured Topics Extended

import async from 'async'
import winston from 'winston'
import tjs from 'templates.js'
import validator from 'validator'

const accountHelpers = require.main.require('./src/controllers/accounts/helpers')
const helpers = require.main.require('./src/controllers/helpers')
const Topics = require.main.require('./src/topics')
const Posts = require.main.require('./src/posts')
const db = require.main.require('./src/database')
const translator = require.main.require('./public/src/modules/translator')
const nconf = require.main.require('nconf')
const Settings = require.main.require('./src/settings')
const User  = require.main.require('./src/user')
const SocketAdmin = require.main.require('./src/socket.io/admin')
const SocketPlugins = require.main.require('./src/socket.io/plugins')
const Utils = require.main.require('./public/src/utils')

const defaultSettings = {
  newsTemplate: 'porta',
  newsHideAnon: 0,
  customTemplate: ''
}

let app, settings, autoFeature

// Hook static:app.load
// Setup routes and settings.
export function init (params, next) {
  app = params.app
  settings = new Settings('featured-topics-extended', '1.0.0', defaultSettings, readSettings)

  const router = params.router
  const middleware = params.middleware

  router.get('/news', middleware.buildHeader, render)
  router.get('/news/:page', middleware.buildHeader, render)
  router.get('/api/news', render)
  router.get('/api/news/:page', render)

  router.get('/featured', middleware.buildHeader, renderEditor)
  router.get('/api/featured', renderEditor)

  function renderEditor (req, res) {
    const page = 1
    const size = 10
    let data = {}

    User.isAdminOrGlobalMod(req.uid, (err, isAdminOrGlobalMod) => {
      data.isSelf = isAdminOrGlobalMod

      prepareEditor (req, res, 0, data, page, size, (err, data) => {
        res.render('fte-featured', data)
      })
    })
  }

  router.get('/user/:userslug/blog', middleware.buildHeader, renderUserBlog)
  router.get('/api/user/:userslug/blog', renderUserBlog)

  function renderUserBlog (req, res) {
    prepareAccountPage(req, 'account/fte-blog', 'Blog', (err, userData) => {
      if (err) {
        winston.error(err)
        return res.redirect(`/user/${req.params.userslug}/`)
      }

      res.render('account/fte-blog', userData)
    })
  }

  router.get('/user/:userslug/featured', middleware.buildHeader, renderUserFeatured)
  router.get('/api/user/:userslug/featured', renderUserFeatured)

  function renderUserFeatured (req, res) {
    const page = 1
    const size = 10

    prepareAccountPage(req, 'account/fte-featured', 'Featured Topic Lists', (err, userData) => {
      if (err) {
        winston.error(err)
        return res.redirect(`/user/${req.params.userslug}/`)
      }

      const {theirid} = userData

      prepareEditor (req, res, theirid, userData, page, size, (err, data) => {
        res.render('account/fte-featured', data)
      })
    })
  }

  function prepareAccountPage (req, tpl, name, next) {
    accountHelpers.getUserDataByUserSlug(req.params.userslug, req.uid, (err, userData) => {
      if (err) return next(err)

      userData.title = '[[pages:' + tpl + ', ' + userData.username + ']]'
      userData.breadcrumbs = helpers.buildBreadcrumbs([{text: userData.username, url: '/user/' + userData.userslug}, {text: '[[user:' + name + ']]'}])

      next(null, userData)
    })
  }

  function prepareEditor (req, res, theirid, data, page, size, next) {
    getFeaturedTopicsLists(req.uid, theirid, (err, lists) => {
      if (err) {
        winston.error(err)
        return res.redirect(theirid ? `/user/${req.params.userslug}/` : '/')
      }

      data.lists = lists
      data.list = lists[0]

      getFeaturedTopics(req.uid, theirid, lists[0].name, page, size, (err, topics) => {
        data.topics = topics
        next(null, data)
      })
    })
  }

  router.get('/admin/plugins/featured-topics-extended', middleware.admin.buildHeader, renderAdmin)
  router.get('/api/admin/plugins/featured-topics-extended', renderAdmin)

  function renderAdmin(req, res, next) {
    getFeaturedTopicsLists(req.uid, 0, (err, lists) => {
      res.render('admin/plugins/featured-topics-extended', {lists: lists.map(list => ({name: list}))})
    })
  }

  SocketAdmin.settings.syncFeaturedTopicsExtended = () => {
    settings.sync(readSettings)
  }

  SocketPlugins.FeaturedTopicsExtended = {}

  SocketPlugins.FeaturedTopicsExtended.getFeaturedTopics = (socket, data, next) => {
    const {uid} = socket

    let {theirid, slug} = data
    theirid = parseInt(theirid, 10) || 0

    getFeaturedTopicsBySlug(uid, theirid, slug, 1, 5, (err, topics) => {
      if (err) return next(err)

      getFeaturedTopicsListBySlug(uid, theirid, slug, (err, list) => {
        if (err) return next(err)

        next(null, {list, topics})
      })
    })
  }

  SocketPlugins.FeaturedTopicsExtended.getFeaturedTopicsLists = (socket, data, next) => {
    const {uid} = socket
    let {theirid} = data

    theirid = parseInt(theirid, 10) || 0

    getFeaturedTopicsLists(uid, theirid, next)
  }

  SocketPlugins.FeaturedTopicsExtended.featureTopic = (socket, data, next) => {
    const {tid, list} = data
    const {uid} = socket
    const isSelf = uid === theirid

    let {theirid} = data
    theirid = parseInt(theirid, 10) || 0

    User.isAdminOrGlobalMod(uid, (err, isAdminOrGlobalMod) => {
      if (err) return next(err)

      if (theirid) { // User Featured List
        if (!isSelf) return next(new Error(`Cannot change another user's featured topics.`))
      } else { // Global List
        if (!isAdminOrGlobalMod) return next(err || new Error('[[error:no-privileges]]'))
      }

      featureTopic(theirid, tid, list, next)
    })
  }

  SocketPlugins.FeaturedTopicsExtended.createList = (socket, data, next) => {
    const {theirid, list} = data
    const {uid} = socket
    let isSelf = parseInt(uid, 10) === parseInt(theirid, 10)

    User.isAdminOrGlobalMod(uid, (err, isAdminOrGlobalMod) => {
      if (err) return next(err)

      if (theirid) { // User Featured List
        if (!isSelf) return next(new Error(`Cannot change another user's featured topics lists.`))
      } else { // Global List
        if (!isAdminOrGlobalMod) return next(err || new Error('[[error:no-privileges]]'))
      }

      createList(theirid, list, next)
    })
  }

  SocketPlugins.FeaturedTopicsExtended.setAutoFeature = (socket, data, next) => {
    let {theirid, list, autoFeature} = data
    const {uid} = socket
    let isSelf = parseInt(uid, 10) === parseInt(theirid, 10)

    autoFeature = typeof autoFeature === 'string' ? autoFeature : ''
    autoFeature = autoFeature.replace(/ /g, '').split(',').map(i => parseInt(i, 10))

    User.isAdminOrGlobalMod(uid, (err, isAdminOrGlobalMod) => {
      if (err) return next(err)

      if (theirid) { // User Featured List
        if (!isSelf) return next(new Error(`Cannot change another user's featured topics lists.`))
      } else { // Global List
        if (!isAdminOrGlobalMod) return next(err || new Error('[[error:no-privileges]]'))
      }

      setAutoFeature(theirid, list, autoFeature, next)
    })
  }

  function readSettings() {
    autoFeature = settings.get('autoFeature').split(',').map(cid => parseInt(cid, 10) || 0)
  }

  // Import News Page list. Depreciated. Remove in v1.0.0
  db.exists(`featuredex:tids`, (err, exists) => {
    if (err || !exists) return next()

    db.getSortedSetRangeByScore('featuredex:tids', 0, 10000, 0, '+inf', (err, tids) => {
      if (err || !tids || !tids.length) {
        return next()
      }

      createList(0, 'News', err => {
        if (err) return next()

        async.each(tids, (tid, next) => {
          featureTopic(0, tid, 'News', next)
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

function featureTopic (theirid, tid, list, next) {
  const listkey = `fte:${theirid}:lists`
  const topicskey = `fte:${theirid}:list:${list}:tids`

  console.log(`Featuring ${tid} on ${topicskey} in ${listkey}`)
  async.waterfall([
    async.apply(db.isSortedSetMember, listkey, list),
    (exists, next) => {
      if (!exists) return next(new Error(`List ${list} does not exist.`))
      next()
    },
    async.apply(Topics.getTopicField, tid, 'timestamp'),
    (timestamp, next) => {
      db.sortedSetAdd(topicskey, timestamp, tid, next)
    }
  ], next)
}

export function getFeaturedTopicsLists (uid, theirid, next) {
  // TODO: List access perms.
  async.waterfall([
    async.apply(createDefaultFeaturedList, theirid),
    async.apply(db.getSortedSetRangeByScore, `fte:${theirid}:lists`, 0, 10000, 0, '+inf'),
    (lists, next) => {
      lists = lists.map(list => `fte:${theirid}:list:${list}`)

      next(null, lists)
    },
    async.apply(db.getObjects),
    (lists, next) => {
      lists = lists.map(list => {
        list.userTitle = validator.escape(list.name)
        return list
      })

      async.each(lists, (list, next) => {
        db.getSortedSetRange(`fte:${theirid}:list:${list.name}:autofeature`, 0, -1, (err, autoFeature) => {
          list.autoFeature = autoFeature
          next()
        })
      }, () => {
        next(null, lists)
      })
    }
  ], next)
}

export function getFeaturedTopicsList (uid, theirid, list, next) {
  db.getObject(`fte:${theirid}:list:${list}`, (err, list) => {
    if (err) return next(err)

    list.userTitle = validator.escape(list.name)

    db.getSortedSetRange(`fte:${theirid}:list:${list}:autofeature`, 0, -1, (err, autoFeature) => {
      if (err) return next(err)

      list.autoFeature = autoFeature

      next(null, list)
    })
  })
}

export function getFeaturedTopicsListBySlug (uid, theirid, slug, next) {
  getListNameBySlug(theirid, slug, (err, list) => {
    if (err) return next(err)

    getFeaturedTopicsList(uid, theirid, list, next)
  })
}

export function getFeaturedTopics (uid, theirid, list, page, size, next) {
  page--

  async.waterfall([
    async.apply(db.getSortedSetRevRangeByScore, `fte:${theirid}:list:${list}:tids`, page * size, page * size + size, '+inf', 0),
    async.apply(getTopicsWithMainPost, uid)
  ], next)
}

export function getFeaturedTopicsBySlug (uid, theirid, slug, page, size, next) {
  getListNameBySlug(theirid, slug, (err, list) => {
    if (err) return next(err)

    getFeaturedTopics(uid, theirid, list, page, size, next)
  })
}

// Create a blank default list.
function createDefaultFeaturedList (theirid, next) {
  theirid = parseInt(theirid, 10) || 0

  const key = `fte:${theirid}:lists`
  const list = theirid ? 'Blog' : 'News'

  db.sortedSetScore(key, list, (err, score) => {
    if (err) return next(err)
    if (!score) return createList(theirid, list, next)
    next()
  })
}

function createList (theirid, list, next) {
  theirid = parseInt(theirid, 10) || 0

  const slug = Utils.slugify(list)
  const created = Date.now()

  async.waterfall([
    async.apply(isListValid, theirid, slug),
    async.apply(db.sortedSetAdd, `fte:${theirid}:lists`, created, list),
    async.apply(db.sortedSetAdd, `fte:${theirid}:lists:bytopics`, 0, list),
    async.apply(db.sortedSetAdd, `fte:${theirid}:lists:byslug`, 0, `${slug}:${list}`),
    async.apply(db.setObjectField, `fte:${theirid}:lists:slugs`, slug, list),
    async.apply(db.setObject, `fte:${theirid}:list:${list}`, {
      name: list,
      topics: 0,
      slug,
      created
    })
  ], next)
}

function createList (theirid, list, next) {
  theirid = parseInt(theirid, 10) || 0

  const slug = Utils.slugify(list)

  async.parallel([
    async.apply(db.sortedSetRemove, `fte:${theirid}:lists`, list),
    async.apply(db.sortedSetRemove, `fte:${theirid}:lists:bytopics`, list),
    async.apply(db.sortedSetRemove, `fte:${theirid}:lists:byslug`, `${slug}:${list}`),
    async.apply(db.deleteObjectField, `fte:${theirid}:lists:slugs`, slug),
    async.apply(db.delete, `fte:${theirid}:list:${list}`),
    function (next) {
      db.getSortedSetRange(`fte:${theirid}:list:${list}:autofeature`, 0, -1, (err, cids) => {
        if (err) return next(err)

        async.parallel([
          async.apply(async.each, cids, (cid, next) => {
            db.sortedSetRemove(`fte:autofeature:${cid}`, list, next)
          }),
          async.apply(db.delete, `fte:${theirid}:list:${list}:autofeature`)
        ], next)
      })
    }
  ], next)
}

function isListValid (theirid, slug, next) {
  getListNameBySlug(theirid, slug, (err, list) => {
    next(list ? new Error('List already exists.') : err)
  })
}

function getListNameBySlug (theirid, slug, next) {
  const key = `fte:${theirid}:lists:slugs`

  db.getObjectField(key, slug, next)
}

// Filter an array of topics and add the main post.
function getTopicsWithMainPost (uid, tids, cb) {
  Topics.getTopics(tids, uid, (err, topicsData) => {
    if (err) return cb(err)

    topicsData = topicsData.filter(topic => !topic.deleted)

    async.forEachOf(topicsData, (topicData, i, next) => {
      Topics.getMainPost(topicData.tid, uid, (err, mainPost) => {
        topicsData[i].post = mainPost
        topicsData[i].humanDate = getDate(topicsData[i].timestamp)

        next()
      })
    }, () => {
      cb(null, topicsData)
    })
  })
}

function getAutoFeature (theirid, slug, next) {
  getListNameBySlug(theirid, slug, (err, list) => {
    if (err) return next(err)

    db.getSortedSetRange(`fte:${theirid}:list:${list}:autofeature`, 0, -1, next)
  })
}

function setAutoFeature (theirid, slug, autoFeature, next) {
  getListNameBySlug(theirid, slug, (err, list) => {
    if (err) return next(err)

    db.getSortedSetRange(`fte:${theirid}:list:${list}:autofeature`, 0, -1, (err, cids) => {
      if (err) return next(err)

      async.parallel([
        async.apply(async.each, cids, (cid, next) => {
          db.sortedSetRemove(`fte:autofeature:${cid}`, list, next)
        }),
        async.apply(db.delete, `fte:${theirid}:list:${list}:autofeature`)
      ], (err) => {
        if (err) return next(err)

        async.parallel([
          async.apply(async.each, autoFeature, (cid, next) => {
            db.sortedSetAdd(`fte:autofeature:${cid}`, 0, list, next)
          }),
          async.apply(db.sortedSetAdd, `fte:${theirid}:list:${list}:autofeature`, 0, cid)
        ])
      })
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
  getFeaturedTopics(widget.uid, 0, widget.list, 1, 5, (err, featuredTopics) => {
    app.render('widgets/featured-topics-ex-sidebar', {topics: featuredTopics}, callback)
  })
}

// Hook filter:widget.render:featuredTopicsExBlocks
export function renderFeaturedTopicsBlocks (widget, callback) {
  getFeaturedTopics(widget.uid, 0, widget.list, 1, 5, (err, featuredTopics) => {
    app.render('widgets/featured-topics-ex-blocks', {topics: featuredTopics}, callback)
  })
}

// Hook filter:widget.render:featuredTopicsExCards
export function renderFeaturedTopicsCards (widget, callback) {
  getFeaturedTopics(widget.uid, 0, widget.list, 1, 5, (err, featuredTopics) => {
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
  getFeaturedTopics(widget.uid, 0, widget.list, 1, 5, (err, featuredTopics) => {
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
  getFeaturedTopics(widget.uid, 0, widget.list, 1, 5, (err, featuredTopics) => {
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
  // TODO
}

// Hook filter:user.profileMenu
// Add links to list management and blog.
export function userProfileMenu (data, next) {
  data.links = data.links.concat([
    {
      name: 'Featured Topic Lists',
      id: 'fte-profilelink-featured',
      public: false,
      route: 'featured',
      icon: 'fa-newspaper-o'
    },
    {
      name: 'Blog',
      id: 'fte-profilelink-blog',
      public: true,
      route: 'blog',
      icon: 'fa-newspaper-o'
    }
  ])

  next(null, data)
}

// Date parsing helper.
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const days   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
function getDate (timestamp) {
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
function render (req, res, next) {
  const payload       = {config: {relative_path: nconf.get('relative_path')}}
  const topicsPerPage = 5
  const uid = req.uid

  if (!uid && settings.get('newsHideAnon')) return res.render('news', payload)

  async.waterfall([
    async.apply(getFeaturedTopics, uid, 0, 'News', req.params.page || 1, topicsPerPage),
    (topicsData, next) => {
      payload.topics = topicsData

      payload.topics.forEach(topic => {
        topic.date = getDate(topic.timestamp)
        topic.replies = topic.postcount - 1
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
    } else {
      const parsed = tjs.parse(settings.get('customTemplate'), payload)
      translator.translate(parsed, translatedHTML => {
        translatedHTML = translatedHTML.replace('&#123;', '{').replace('&#125;', '}')
        payload.newsTemplate = translatedHTML
        res.render('news', res.locals.isAPI ? payload : {newsTemplate: translatedHTML})
      })
    }
  })
}
