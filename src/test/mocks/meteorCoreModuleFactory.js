import { TestMongo } from './testMongo'
import { MockApiRegistry } from './apiRegistry'
import { MockTracker } from './mockTracker'
import { MockMongoMirror } from './mockMongoMirror'


export default (meteorProperties = { isServer: true, isClient: false, isCordova: false }) =>
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
    if (meteorProperties.isServer) {
      Accounts._loginHandlers = []
      Accounts._validateLoginHook.callbacks = {}
      Accounts._onLogoutHook.callbacks = {}
      delete Accounts._onCreateUserHook
    }
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
      result.mongoMirror = new MockMongoMirror()
    }
    return result
  }
