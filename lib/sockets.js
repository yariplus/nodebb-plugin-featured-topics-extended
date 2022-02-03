// sockets.js

const User = require.main.require('./src/user')

const featured = require('./featured')

exports.getFeaturedTopics = async (socket, data) => {
  const {uid} = socket
  let {theirid, slug, page, size} = data

  theirid = parseInt(theirid, 10) || 0

  const topics = await featured.getFeaturedTopicsBySlug(uid, theirid, slug, page, size)
  const list = await featured.getFeaturedTopicsListBySlug(uid, theirid, slug)

  return {list, topics}
}

exports.getFeaturedTopicsLists = async (socket, data) => {
  const {uid} = socket
  let {theirid} = data

  theirid = parseInt(theirid, 10) || 0

  let lists = await featured.getFeaturedTopicsLists(uid, theirid)

  return lists
}

exports.featureTopic = async (socket, data) => {
  const {uid} = socket
  let {theirid, slug, tid} = data

  theirid = parseInt(theirid, 10) || 0

  if (theirid) { // User Featured List
    const isSelf = parseInt(uid, 10) === parseInt(theirid, 10)

    if (!isSelf) throw new Error(`Cannot change another user's featured topics.`)
  } else { // Global List
    const isAdminOrGlobalMod = await User.isAdminOrGlobalMod(uid)

    if (!isAdminOrGlobalMod) throw new Error('[[error:no-privileges]]')
  }

  await featured.featureTopic(theirid, tid, slug)

  return
}

exports.unfeatureTopic = async (socket, data) => {
  const {tid, slug} = data
  const {uid} = socket
  let {theirid} = data

  theirid = parseInt(theirid, 10) || 0

  if (theirid) { // User Featured List
    const isSelf = parseInt(uid, 10) === parseInt(theirid, 10)

    if (!isSelf) throw new Error(`Cannot change another user's featured topics.`)
  } else { // Global List
    const isAdminOrGlobalMod = await User.isAdminOrGlobalMod(uid)

    if (!isAdminOrGlobalMod) throw new Error('[[error:no-privileges]]')
  }

  await featured.unfeatureTopic(theirid, tid, slug)

  return
}

exports.createList = async (socket, data) => {
  const {uid} = socket
  let {theirid, list} = data
  let isSelf = parseInt(uid, 10) === parseInt(theirid, 10)

  theirid = parseInt(theirid, 10) || 0

  if (theirid) { // User Featured List
    const isSelf = parseInt(uid, 10) === parseInt(theirid, 10)

    if (!isSelf) throw new Error(`Cannot change another user's featured topics.`)
  } else { // Global List
    const isAdminOrGlobalMod = await User.isAdminOrGlobalMod(uid)

    if (!isAdminOrGlobalMod) throw new Error('[[error:no-privileges]]')
  }

  await featured.createList(theirid, list)

  return
}

exports.deleteList = async (socket, data) => {
  const {uid} = socket
  let {theirid, slug} = data
  let isSelf = parseInt(uid, 10) === parseInt(theirid, 10)

  theirid = parseInt(theirid, 10) || 0

  if (theirid) { // User Featured List
    const isSelf = parseInt(uid, 10) === parseInt(theirid, 10)

    if (!isSelf) throw new Error(`Cannot change another user's featured topics.`)
  } else { // Global List
    const isAdminOrGlobalMod = await User.isAdminOrGlobalMod(uid)

    if (!isAdminOrGlobalMod) throw new Error('[[error:no-privileges]]')
  }

  await featured.deleteList(theirid, slug)

  return
}

exports.setAutoFeature = async (socket, data) => {
  const {uid} = socket
  let {theirid, slug, autoFeature} = data
  let isSelf = parseInt(uid, 10) === parseInt(theirid, 10)

  theirid = parseInt(theirid, 10) || 0

  if (theirid) { // User Featured List
    const isSelf = parseInt(uid, 10) === parseInt(theirid, 10)

    if (!isSelf) throw new Error(`Cannot change another user's featured topics.`)
  } else { // Global List
    const isAdminOrGlobalMod = await User.isAdminOrGlobalMod(uid)

    if (!isAdminOrGlobalMod) throw new Error('[[error:no-privileges]]')
  }

  autoFeature = typeof autoFeature === 'string' ? autoFeature : ''
  autoFeature = autoFeature.replace(/ /g, '').split(',').map(cid => parseInt(cid, 10)).filter(cid => cid)

  await featured.setAutoFeature(theirid, slug, autoFeature)

  return
}
