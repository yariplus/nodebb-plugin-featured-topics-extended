// controllers.js

const featured = require('./featured')
const settings = require('./settings')
const helpers = require('./helpers')

const winston = require.main.require('winston')
const benchpress = require.main.require('benchpressjs')
const nconf = require.main.require('nconf')

const User = require.main.require('./src/user')
const Widgets = require.main.require('./src/widgets')
const accountHelpers = require.main.require('./src/controllers/accounts/helpers')
const controllerHelpers = require.main.require('./src/controllers/helpers')

const translator = require.main.require('./src/translator')
const db = require.main.require('./src/database')

const GLOBALUID = 0

exports.renderAdminLists = async (req, res) => {
  const {uid} = req

  const lists = await featured.getFeaturedTopicsLists(uid, GLOBALUID)

  if (!lists || !lists.length) return controllerHelpers.redirect(res, `/`)

  const topics = await featured.getFeaturedTopics(uid, GLOBALUID, lists[0].name, 0, 0)
  const isSelf = await User.isAdminOrGlobalMod(uid)

  res.render('fte-featured', {
    lists,
    topics,
    isSelf
  })
}

exports.renderUserLists = async (req, res) => {
  const {uid} = req

  const {userslug} = req.params
  const userData = await accountHelpers.getUserDataByUserSlug(userslug, uid)
  const {theirid, username} = userData

  const lists = await featured.getFeaturedTopicsLists(uid, theirid)

  if (!lists || !lists.length) return controllerHelpers.redirect(res, `/user/${userslug}/`)

  const topics = await featured.getFeaturedTopics(uid, theirid, lists[0].name, 0, 0)
  const title = `${username} [[fte:featuredtopics]]`
  const breadcrumbs = controllerHelpers.buildBreadcrumbs([{text: username, url: `/user/${userslug}`}, {text: `[[fte:featuredtopics]]`}])

  res.render('account/fte-featured', {
    ...userData,
    lists,
    topics,
    title,
    breadcrumbs
  })
}

exports.renderNewsPage = async (req, res) => {
  const {uid} = req
  const carousel = settings.get('carousel')
  const template = settings.get('newsTemplate')
  const page = req.params.page || 1
  const size = 5
  const slug = 'news'
  const options = {
    featuredRoute: `/news/`,
    req
  }

  if (!uid && settings.get('newsHideAnon')) return res.render('news', {}) // We just render the blank page with widgets.

  // We need to pull the widget data to render widgets on the news template.
  // TODO
  let widgets = {}

  let data = await parseFeaturedPage({
    uid,
    theirid: GLOBALUID,
    slug,
    page,
    size,
    template,
    data: {...options, widgets, carousel}
  })

  data.template = {name: 'news', news: true}
  data.title = settings.get('newsPageTitle') || 'News' // TODO: Use translations

  res.render('news', data)
}

exports.renderBlogPage = async (req, res) => {
  const {uid} = req
  const template = settings.get('newsTemplate') || settings.defaultSettings['newsTemplate']
  const page = req.params.page || 1
  const size = 5
  const slug = req.params.listslug || 'blog'

  let userData = await accountHelpers.getUserDataByUserSlug(req.params.userslug, req.uid)

  userData.title = `${userData.username} [[fte:blog]]`
  userData.breadcrumbs = controllerHelpers.buildBreadcrumbs([{text: userData.username, url: `/user/${userData.userslug}`}, {text: `[[fte:blog]]`}])

  let data = await parseFeaturedPage({
    uid,
    theirid: userData.uid,
    slug,
    page,
    size,
    template,
    data: {
      featuredRoute: `/user/${userData.userslug}/${slug}/`,
      req,
    }
  })

  data.title = 'Blog' // TODO: Use translations, add custom titles.

  res.render('account/fte-blog', {...data, ...userData})
}

// Parse featured topics page using a template.
const parseFeaturedPage = async ({
    uid,
    theirid,
    slug,
    page,
    size,
    template,
    data
  }) => {
  let list = await db.getObjectField(`fte:${theirid}:lists:slugs`, slug)
  let count = await db.sortedSetCount(`fte:${theirid}:list:${list}:tids`, '-inf', '+inf')

  let pageCount = Math.max(1, Math.ceil(count/size))
  page = parseInt(page, 10)
  const nextpage = page === pageCount ? false : page + 1
  const prevpage = page === 1 ? false : page - 1

  let pages = []
  while (pageCount > 0) {
    pages.unshift({number: pageCount, currentPage: pageCount === page})
    pageCount--
  }

  let topics = await featured.getFeaturedTopicsBySlug(uid, theirid, slug, page, size)

  data.paginator = pages.length > 1

  let data2 = await parseFeaturedPageTopics(template, topics, page, pages, nextpage, prevpage, data)

  return data2
}
exports.parseFeaturedPage = parseFeaturedPage

const parseFeaturedPageTopics = async (template, topics, page, pages, nextpage, prevpage, data) => {
  let charLimit = parseInt(settings.get('newsPostCharLimit'), 10)

  topics.forEach(topic => {
    let imgmatch = topic.post.content.match(/<img.*?src="(?<imageurl>[^"]*?)"/)

    // TODO: Remove back compatibility in 1.0
    if (topic.thumbs && topic.thumbs.length) {
      topic.imageurl = nconf.get('relative_path') + topic.thumbs[0].url
    } else if (topic.thumb) {
      topic.imageurl = topic.thumb
    } else if (imgmatch && imgmatch.length) {
      topic.imageurl = imgmatch[1]
    }

    if (charLimit) {
      topic.post.content = helpers.clip(topic.post.content, charLimit, {
        breakWords: true,
        indicator: '...',
      })
    }
  })

  // Add relative_path for sub-directory installs.
  data.config = {relative_path: nconf.get('relative_path')}

  let featuredTemplate
  if (template !== 'custom') {
    featuredTemplate = await data.req.app.renderAsync(`news-${template}`, {...data, topics, pages, nextpage, prevpage})
  } else {
    featuredTemplate = await benchpress.compileRender(settings.get('customTemplate'), {...data, topics, pages, nextpage, prevpage})
  }

  return {featuredTemplate, topics, page, pages, nextpage, prevpage}
}
exports.parseFeaturedPageTopics = parseFeaturedPageTopics

exports.renderAdmin = async (req, res) => {
  let lists = await featured.getFeaturedTopicsLists(req.uid, 0)

  res.render('admin/plugins/featured-topics-extended', {lists: lists.map(list => ({name: list}))})
}
