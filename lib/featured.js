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

  let exists = await db.isSortedSetMember(listkey, list)

  if (!exists) throw new Error(`List ${list} does not exist.`)

  let timestamp = await Topics.getTopicField(tid, 'timestamp')

  await db.sortedSetAdd(`tid:${tid}:featured`, 0, `${theirid}:${list}`)
  await db.sortedSetAdd(topicskey, timestamp, tid)

  return
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
async function createDefaultFeaturedList (theirid) {
  theirid = parseInt(theirid, 10) || 0

  const key = `fte:${theirid}:lists`
  const list = theirid ? 'Blog' : 'News'

  let score = await db.sortedSetScore(key, list)

  if (!score) await createList(theirid, list)

  return
}

const createList = async (theirid, list) => {
  theirid = parseInt(theirid, 10) || 0

  const slug = Slugify(list)
  const created = Date.now()

  // TODO: Actually handle this.
  await isListValid(theirid, slug)

  await db.sortedSetAdd(`fte:${theirid}:lists`, created, list)
  await db.sortedSetAdd(`fte:${theirid}:lists:bytopics`, 0, list)
  await db.sortedSetAdd(`fte:${theirid}:lists:byslug`, 0, `${slug}:${list}`)
  await db.setObjectField(`fte:${theirid}:lists:slugs`, slug, list)
  await db.setObject(`fte:${theirid}:list:${list}`, {
    name: list,
    topics: 0,
    slug,
    created
  })
}
exports.createList = createList

const deleteList = async (theirid, slug) => {
  theirid = parseInt(theirid, 10) || 0 // TODO: ?????

  const list = await getListNameBySlug(theirid, slug)

  await Promise.all([
    db.sortedSetRemove(`fte:${theirid}:lists`, list),
    db.sortedSetRemove(`fte:${theirid}:lists:bytopics`, list),
    db.sortedSetRemove(`fte:${theirid}:lists:byslug`, `${slug}:${list}`),
    db.deleteObjectField(`fte:${theirid}:lists:slugs`, slug),
    db.delete(`fte:${theirid}:list:${list}`)
  ])
}
exports.deleteList = deleteList

async function removeAutoFeature (theirid, list) {
  const cids = await db.getSortedSetRange(`fte:${theirid}:list:${list}:autofeature`, 0, -1)

  await Promise.all(cids.map(cid => db.sortedSetRemove(`fte:autofeature:${cid}`, list)))
  await db.delete(`fte:${theirid}:list:${list}:autofeature`)
}

async function createAutoFeature (theirid, list, cids) {
  await Promise.all(cids.map(cid => db.sortedSetAdd(`fte:autofeature:${cid}`, 0, `${theirid}:${list}`)))
  await Promise.all(cids.map(cid => db.sortedSetAdd(`fte:${theirid}:list:${list}:autofeature`, 0, cid)))
}

async function isListValid (theirid, slug) {
  return await getListNameBySlug(theirid, slug) ? false : true
}

exports.getAutoFeature = async (theirid, slug) => {
  const list = await getListNameBySlug(theirid, slug)

  return await db.getSortedSetRange(`fte:${theirid}:list:${list}:autofeature`, 0, -1)
}

exports.setAutoFeature = async (theirid, slug, autoFeature) => {
  const list = await getListNameBySlug(theirid, slug)

  await removeAutoFeature(theirid, list)
  await createAutoFeature(theirid, list, autoFeature)

  return
}
