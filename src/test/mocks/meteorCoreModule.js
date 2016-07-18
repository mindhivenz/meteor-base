import { sinon } from '../../mocha'
import { MiniMongo } from './minimongo'
import { MockApiRegistry } from './apiRegistry'


export default () => {
  const {
    SimpleSchema,
    Random,
  } = global
  global.Meteor.users = new MiniMongo.Collection('users')
  return {
    Meteor: {
      isServer: true,
    },
    Tracker: {},
    Mongo: MiniMongo,
    Users: global.Meteor.users,
    SimpleSchema,
    apiRegistry: new MockApiRegistry(),
    Accounts: {
      config: sinon.spy(),
      validateLoginAttempt: sinon.spy(),
    },
    Random,
  }
}
