/* global browser */
import { appContext } from '@mindhive/di/test'


const globallyApply = (globalPropertyName, value) => {
  if (global[globalPropertyName]) {
    throw new ReferenceError(`${globalPropertyName} already defined in global`)
  }
  global[globalPropertyName] = value
}

const resetDatabase = () => {
  const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db
  const syncCollections = global.Meteor.wrapAsync(db.collections, db)
  const collections = syncCollections()

  collections.
    filter(col => col.collectionName !== 'system.indexes').
    forEach(col => {
      const syncRemove = global.Meteor.wrapAsync(col.remove, col)
      syncRemove({})
    })
}

const applyBackDoorMethods = () => {
  global.Meteor.methods({
    'backdoor.setUserId'(userId) {
      this.setUserId(userId)
    },
  })
}

/*
Sets up all backdoors
 */
export const open = () => {
  if (global.Meteor.isServer) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Only open the backdoor in when NODE_ENV=test')
    }
    globallyApply('appContext', appContext)
    globallyApply('resetDatabase', resetDatabase)
    applyBackDoorMethods()
  }
}

/*
Sets the userId on a browser connection in a webdriver test to appear as tho you're logged in
 */
export const login = (userId) => {
  browser.execute(id => {
    Meteor.call('backdoor.setUserId', id, function () {  // eslint-disable-line
      Meteor.connection.setUserId(id)
    })
  }, userId)
}
