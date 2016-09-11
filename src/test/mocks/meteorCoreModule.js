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
