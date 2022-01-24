// featured.js

const async = require.main.require('async')
const winston = require.main.require('winston')
const validator = require.main.require('validator')

const Topics = require.main.require('./src/topics')
const db = require.main.require('./src/database')

const helpers = require('./helpers')

exports.getFeaturedTopicsLists = (uid, theirid, next) => {
  // TODO: List access perms.
  async.waterfall([
    //async.apply(createDefaultFeaturedList, theirid),
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

exports.getFeaturedTopicsList = (uid, theirid, list, next) => {
  db.getObject(`fte:${theirid}:list:${list}`, (err, list) => {
    if (err) return next(err)

    list.userTitle = validator.escape(list.name)

    db.getSortedSetRange(`fte:${theirid}:list:${list.name}:autofeature`, 0, -1, (err, autoFeature) => {
      if (err) return next(err)

      list.autoFeature = autoFeature

      next(null, list)
    })
  })
}

exports.getFeaturedTopics = (uid, theirid, list, page, size, callback) => {
  page = parseInt(page)
  page = page > 0 ? page : 1
  size = parseInt(size)
  size = size > 0 ? size : 10
  page--

  // TODO: filter tids
  async.waterfall([
    async.apply(db.getSortedSetRevRangeByScore, `fte:${theirid}:list:${list}:tids`, page * size, size, '+inf', 0),
    async.apply(getTopicsWithMainPost, uid)
  ], callback)
}

// Filter an array of topics and add the main post.
function getTopicsWithMainPost (uid, tids, cb) {
  Topics.getTopics(tids, uid, (err, topicsData) => {
    if (err) return cb(err)

    let recycle = false
    topicsData = topicsData.filter(topic => !topic.deleted)

    async.forEachOf(topicsData, (topicData, i, next) => {
      Topics.getMainPost(topicData.tid, uid, (err, mainPost) => {
        topicsData[i].post = mainPost
        topicsData[i].date = helpers.getDate(topicsData[i].timestamp)
        topicsData[i].replies = topicsData[i].postcount - 1

        next()
      })
    }, () => {
      cb(null, topicsData)
    })
  })
}

function unfeatureTopic (theirid, tid, slug, next) {
  slug = Slugify(slug)

  getListNameBySlug(theirid, slug, (err, list) => {
    if (err) return next(err)

    const topicskey = `fte:${theirid}:list:${list}:tids`

    winston.info(`Unfeaturing ${tid} on ${topicskey}`)

    db.sortedSetRemove(`tid:${tid}:featured`, `${theirid}:${list}`)
    db.sortedSetRemove(topicskey, tid, next)
  })
}

function getListNameBySlug (theirid, slug, next) {
  const key = `fte:${theirid}:lists:slugs`

  db.getObjectField(key, slug, next)
}

