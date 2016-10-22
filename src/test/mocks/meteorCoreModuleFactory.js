import { TestMongo } from './testMongo'
import { MockApiRegistry } from './apiRegistry'
import { MockTracker } from './mockTracker'


export default (meteorProperties = { isSever: true }) =>
  () => {
    const {
      Meteor,
      SimpleSchema,
      Random,
      Accounts,
    } = global
    Accounts.users = new TestMongo.Collection('users')
    Meteor.users = Accounts.users
    Accounts._options = {}
    Accounts._loginHandlers = []
    Accounts._validateLoginHook.callbacks = {}
    Accounts._onLogoutHook.callbacks = {}
    const result = {
      Meteor: {
        ...meteorProperties,
        wrapAsync: Meteor.wrapAsync,
      },
      Mongo: TestMongo,
      Users: Accounts.users,
      SimpleSchema,
      apiRegistry: new MockApiRegistry(),
      Accounts,
      Random,
    }
    if (meteorProperties.isClient) {
      result.Tracker = new MockTracker()
    }
    return result
  }
