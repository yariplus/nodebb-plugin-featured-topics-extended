// controllers.js

const featured = require('./featured')

const winston = require.main.require('winston')

const User = require.main.require('./src/user')
const accountHelpers = require.main.require('./src/controllers/accounts/helpers')
const controllerHelpers = require.main.require('./src/controllers/helpers')

exports.renderEditor = async (req, res) => {
  const isSelf = await User.isAdminOrGlobalMod(req.uid)

  prepareEditor(req, res, 0, {isSelf}, 0, 0, (err, data) => {
    res.render('fte-featured', data)
  })
}

exports.renderUserFeatured = (req, res) => {
  prepareAccountPage(req, 'account/fte-featured', 'Featured Topic Lists', (err, userData) => {
    if (err) {
      winston.error(err)
      return res.redirect(`/user/${req.params.userslug}/`)
    }

    const {theirid} = userData

    prepareEditor(req, res, theirid, userData, 0, 0, (err, data) => {
      data.title = `${userData.username} [[fte:featuredtopics]]`
      data.breadcrumbs = controllerHelpers.buildBreadcrumbs([{text: userData.username, url: `/user/${userData.userslug}`}, {text: `[[fte:featuredtopics]]`}])

      res.render('account/fte-featured', data)
    })
  })
}

const prepareAccountPage = (req, tpl, name, next) => {
  accountHelpers.getUserDataByUserSlug(req.params.userslug, req.uid, (err, userData) => {
    if (err) return next(err)

    next(null, userData)
  })
}

const prepareEditor = (req, res, theirid, data, page, size, next) => {
  featured.getFeaturedTopicsLists(req.uid, theirid, (err, lists) => {
    // TODO: This should never happen.
    if (err || !lists || !lists.length) {
      winston.error(err)
      return res.redirect(theirid ? `/user/${req.params.userslug}/` : '/')
    }

    data.lists = lists
    data.list = lists[0]

    featured.getFeaturedTopics(req.uid, theirid, lists[0].name, page, size, (err, topics) => {
      data.topics = topics
      next(null, data)
    })
  })
}

