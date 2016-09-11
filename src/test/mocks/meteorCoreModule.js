import { MiniMongo } from './minimongo'
import { MockApiRegistry } from './apiRegistry'


export default () => {
  const {
    Meteor,
    SimpleSchema,
    Random,
    Accounts,
  } = global
  Accounts.users = new MiniMongo.Collection('users')
  Meteor.users = Accounts.users
  return {
    Meteor: {
      isServer: true,
      wrapAsync: Meteor.wrapAsync,
    },
    Tracker: {},
    Mongo: MiniMongo,
    Users: Accounts.users,
    SimpleSchema,
    apiRegistry: new MockApiRegistry(),
    Accounts,
    Random,
  }
}
