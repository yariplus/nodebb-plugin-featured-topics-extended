// featured.js

const async = require.main.require('async')
const winston = require.main.require('winston')
const validator = require.main.require('validator')
const Slugify = require.main.require('./src/slugify')

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

const getFeaturedTopicsList = (uid, theirid, list, next) => {
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
exports.getFeaturedTopicsList = getFeaturedTopicsList

const getFeaturedTopics = (uid, theirid, list, page, size, callback) => {
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
exports.getFeaturedTopics = getFeaturedTopics

// Filter an array of topics and add the main post.
const getTopicsWithMainPost = (uid, tids, cb) => {
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
exports.getTopicsWithMainPost = getTopicsWithMainPost

exports.unfeatureTopic = (theirid, tid, slug, next) => {
  slug = Slugify(slug)

  getListNameBySlug(theirid, slug, (err, list) => {
    if (err) return next(err)

    const topicskey = `fte:${theirid}:list:${list}:tids`

    winston.info(`Unfeaturing ${tid} on ${topicskey}`)

    db.sortedSetRemove(`tid:${tid}:featured`, `${theirid}:${list}`)
    db.sortedSetRemove(topicskey, tid, next)
  })
}

const getListNameBySlug = (theirid, slug, next) => {
  const key = `fte:${theirid}:lists:slugs`

  db.getObjectField(key, slug, next)
}
exports.getListNameBySlug = getListNameBySlug

exports.featureTopic = (theirid, tid, slug, next) => {
  slug = Slugify(slug)

  getListNameBySlug(theirid, slug, (err, list) => {
    if (err) return next(err)

    const listkey = `fte:${theirid}:lists`
    const topicskey = `fte:${theirid}:list:${list}:tids`

    winston.info(`Featuring ${tid} on ${topicskey} in ${listkey}`)

    async.waterfall([
      async.apply(db.isSortedSetMember, listkey, list),
      (exists, next) => {
        if (!exists) return next(new Error(`List ${list} does not exist.`))
        next()
      },
      async.apply(Topics.getTopicField, tid, 'timestamp'),
      (timestamp, next) => {
        db.sortedSetAdd(`tid:${tid}:featured`, 0, `${theirid}:${list}`)
        db.sortedSetAdd(topicskey, timestamp, tid, next)
      }
    ], next)
  })
}

exports.getFeaturedTopicsListBySlug = (uid, theirid, slug, next) => {
  getListNameBySlug(theirid, slug, (err, list) => {
    if (err) return next(err)

    getFeaturedTopicsList(uid, theirid, list, next)
  })
}

exports.getFeaturedTopicsBySlug = (uid, theirid, slug, page, size, next) => {
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

const createList = (theirid, list, next) => {
  theirid = parseInt(theirid, 10) || 0

  const slug = Slugify(list)
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
exports.createList = createList

const deleteList = (theirid, slug, next) => {
  theirid = parseInt(theirid, 10) || 0

  getListNameBySlug(theirid, slug, (err, list) => {
    if (err) return next(err)

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
  })
}
exports.deleteList = deleteList

function isListValid (theirid, slug, next) {
  getListNameBySlug(theirid, slug, (err, list) => {
    next(list ? new Error('List already exists.') : err)
  })
}

exports.getAutoFeature = (theirid, slug, next) => {
  getListNameBySlug(theirid, slug, (err, list) => {
    if (err) return next(err)

    db.getSortedSetRange(`fte:${theirid}:list:${list}:autofeature`, 0, -1, next)
  })
}

exports.setAutoFeature = (theirid, slug, autoFeature, next) => {
  getListNameBySlug(theirid, slug, (err, list) => {
    if (err) return next(err)

    db.getSortedSetRange(`fte:${theirid}:list:${list}:autofeature`, 0, -1, (err, cids) => {
      if (err) return next(err)

      async.parallel([
        async.apply(async.each, cids, (cid, next) => {
          db.sortedSetRemove(`fte:autofeature:${cid}`, `${theirid}:${list}`, next)
        }),
        async.apply(db.delete, `fte:${theirid}:list:${list}:autofeature`)
      ], (err) => {
        if (err) return next(err)

        async.each(autoFeature, (cid, next) => {
          if (!cid) return next()

          winston.info(`Setting autofeature key 'fte:autofeature:${cid}' value '${theirid}:${list}'`)
          winston.info(`Setting autofeature key 'fte:${theirid}:list:${list}:autofeature' value '${cid}'`)

          async.parallel([
            async.apply(db.sortedSetAdd, `fte:autofeature:${cid}`, 0, `${theirid}:${list}`, next),
            async.apply(db.sortedSetAdd, `fte:${theirid}:list:${list}:autofeature`, 0, cid)
          ], next)
        }, next)
      })
    })
  })
}
