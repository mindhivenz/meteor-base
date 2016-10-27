/* global MongoInternals */


const resetDatabase = () => {
  const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db
  const syncCollections = global.Meteor.wrapAsync(db.collections, db)
  const collections = syncCollections()

  collections
    .filter(col => col.collectionName !== 'system.indexes')
    .forEach(col => {
      const syncRemove = global.Meteor.wrapAsync(col.remove, col)
      syncRemove({})
    })
}

const applyBackDoorMethods = () => {
  global.Meteor.methods({
    'backdoor.setUserId'(userId) {  // eslint-disable-line object-shorthand
      this.setUserId(userId)
    },
  })
}

export default () => {
  if (global.Meteor.isServer) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Only open the backdoor in when NODE_ENV=test')
    }
    global.resetDatabase = resetDatabase
    applyBackDoorMethods()
  }
}
