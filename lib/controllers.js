// controllers.js

const featured = require('./featured')

const winston = require.main.require('winston')

const User = require.main.require('./src/user')

exports.renderEditor = async (req, res) => {
  const isSelf = await User.isAdminOrGlobalMod(req.uid)

  prepareEditor(req, res, 0, {isSelf}, 0, 0, (err, data) => {
    res.render('fte-featured', data)
  })
}

const prepareEditor = (req, res, theirid, data, page, size, next) => {
  featured.getFeaturedTopicsLists(req.uid, theirid, (err, lists) => {
    if (err) {
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

