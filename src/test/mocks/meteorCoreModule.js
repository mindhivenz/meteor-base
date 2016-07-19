import { MiniMongo } from './minimongo'
import { MockApiRegistry } from './apiRegistry'


export default () => {
  const {
    Meteor,
    SimpleSchema,
    Random,
    Accounts,
  } = global
  Meteor.users = new MiniMongo.Collection('users')
  return {
    Meteor: {
      isServer: true,
      wrapAsync: Meteor.wrapAsync,
    },
    Tracker: {},
    Mongo: MiniMongo,
    Users: Meteor.users,
    SimpleSchema,
    apiRegistry: new MockApiRegistry(),
    Accounts: {
      _bcryptRounds: Accounts._bcryptRounds,  // eslint-disable-line no-underscore-dangle
    },
    Random,
  }
}
