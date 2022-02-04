// compat.js

const db = require.main.require('./src/database')
const settings = require('./settings')

exports.migrate = async () => {
  // Import News Page list. Depreciated. Remove in v1.0.0
  if (await db.exists(`featuredex:tids`)) {
    const tids = await db.getSortedSetRangeByScore('featuredex:tids', 0, 10000, 0, '+inf')

    await createList(0, 'News')

    await Promise.all(tids.map(tid => featured.featureTopic(0, tid, 'News')))

    if (settings.get('autoFeature')) {
      await featured.setAutoFeature(0, 'news', settings.get('autoFeature').replace(/ /g, '').split(',').map(cid => parseInt(cid, 10)).filter(cid => cid))
    }

    await db.delete('featuredex:tids')
  }
}
