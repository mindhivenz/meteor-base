/* eslint-disable no-underscore-dangle */

import { TestMongo } from './testMongo'
import { MockApiRegistry } from './apiRegistry'


export default () => {
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
  return {
    Meteor: {
      isServer: true,
      wrapAsync: Meteor.wrapAsync,
    },
    Tracker: {},
    Mongo: TestMongo,
    Users: Accounts.users,
    SimpleSchema,
    apiRegistry: new MockApiRegistry(),
    Accounts,
    Random,
  }
}
