// featured.js

const winston = require.main.require('winston')
const validator = require.main.require('validator')
const Slugify = require.main.require('./src/slugify')

const Topics = require.main.require('./src/topics')
const db = require.main.require('./src/database')

const helpers = require('./helpers')

exports.getFeaturedTopicsLists = async (uid, theirid) => {
  // TODO: List access perms.

  //async.apply(createDefaultFeaturedList, theirid),
  const names = await db.getSortedSetRangeByScore(`fte:${theirid}:lists`, 0, 10000, 0, '+inf')

  const listKeys = names.map(names => `fte:${theirid}:list:${names}`)

  let lists = await db.getObjects(listKeys)

  lists = lists.map(list => {
    list.userTitle = validator.escape(list.name)
    return list
  })

  for (let i in lists) {
    lists[i].autoFeature = await db.getSortedSetRange(`fte:${theirid}:list:${lists[i].name}:autofeature`, 0, -1)
  }

  return lists
}

const getFeaturedTopicsList = async (uid, theirid, name) => {
  let list = await db.getObject(`fte:${theirid}:list:${name}`)

  list.userTitle = validator.escape(list.name)
  list.autoFeature = await db.getSortedSetRange(`fte:${theirid}:list:${name}:autofeature`, 0, -1)

  return list
}
exports.getFeaturedTopicsList = getFeaturedTopicsList

const getFeaturedTopics = async (uid, theirid, list, page, size) => {
  page = parseInt(page)
  page = page > 0 ? page : 1
  size = parseInt(size)
  size = size > 0 ? size : 10
  page--

  const tids = await db.getSortedSetRevRangeByScore(`fte:${theirid}:list:${list}:tids`, page * size, size, '+inf', 0)
  const topics = await getTopicsWithMainPost(uid, tids)

  return topics
}
exports.getFeaturedTopics = getFeaturedTopics

// Filter an array of topics and add the main post.
const getTopicsWithMainPost = async (uid, tids) => {
  let topics = await Topics.getTopics(tids, uid, tids)

  topics = topics.filter(topic => !topic.deleted)

  for (let i in topics) {
    let post = await Topics.getMainPost(topics[i].tid, uid)

    topics[i].post = post
    topics[i].date = helpers.getDate(topics[i].timestamp)
    topics[i].replies = topics[i].postcount - 1
  }

  return topics
}
exports.getTopicsWithMainPost = getTopicsWithMainPost

exports.unfeatureTopic = async (theirid, tid, slug) => {
  slug = Slugify(slug)

  const list = await getListNameBySlug(theirid, slug)

  const topicskey = `fte:${theirid}:list:${list}:tids`

  winston.info(`Unfeaturing ${tid} on ${topicskey}`)

  db.sortedSetRemove(`tid:${tid}:featured`, `${theirid}:${list}`)
  db.sortedSetRemove(topicskey, tid)
}

const getListNameBySlug = async (theirid, slug) => {
  const key = `fte:${theirid}:lists:slugs`

  return await db.getObjectField(key, slug)
}
exports.getListNameBySlug = getListNameBySlug

exports.featureTopic = async (theirid, tid, slug) => {
  slug = Slugify(slug)

  const list = await getListNameBySlug(theirid, slug)

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
}

exports.getFeaturedTopicsListBySlug = async (uid, theirid, slug) => {
  const list = await getListNameBySlug(theirid, slug)

  return await getFeaturedTopicsList(uid, theirid, list)
}

exports.getFeaturedTopicsBySlug = async (uid, theirid, slug, page, size) => {
  const list = await getListNameBySlug(theirid, slug)

  return await getFeaturedTopics(uid, theirid, list, page, size)
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

const deleteList = async (theirid, slug) => {
  theirid = parseInt(theirid, 10) || 0 // TODO: ?????

  const list = await getListNameBySlug(theirid, slug)

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
  ])
}
exports.deleteList = deleteList

async function isListValid (theirid, slug) {
  return await getListNameBySlug(theirid, slug) ? false : true
}

exports.getAutoFeature = async (theirid, slug) => {
  const list = await getListNameBySlug(theirid, slug)

  return await db.getSortedSetRange(`fte:${theirid}:list:${list}:autofeature`, 0, -1)
}

exports.setAutoFeature = async (theirid, slug, autoFeature) => {
  const list = await getListNameBySlug(theirid, slug)

  const cids = await db.getSortedSetRange(`fte:${theirid}:list:${list}:autofeature`, 0, -1)

  async.parallel([
    async.apply(async.each, cids, (cid, next) => {
      db.sortedSetRemove(`fte:autofeature:${cid}`, `${theirid}:${list}`, next)
    }),
    async.apply(db.delete, `fte:${theirid}:list:${list}:autofeature`)
  ], (err) => {
    // TODO: asyncify
    async.each(autoFeature, (cid, next) => {
      if (!cid) return next()

      winston.info(`Setting autofeature key 'fte:autofeature:${cid}' value '${theirid}:${list}'`)
      winston.info(`Setting autofeature key 'fte:${theirid}:list:${list}:autofeature' value '${cid}'`)

      async.parallel([
        async.apply(db.sortedSetAdd, `fte:autofeature:${cid}`, 0, `${theirid}:${list}`, next),
        async.apply(db.sortedSetAdd, `fte:${theirid}:list:${list}:autofeature`, 0, cid)
      ], next)
    })
  })
}
