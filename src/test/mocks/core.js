import { sinon } from '../../mocha'
import { MiniMongo } from './minimongo'
import { MockApiRegistry } from './api'


export default () => {
  const {
    SimpleSchema,
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
  }
}
