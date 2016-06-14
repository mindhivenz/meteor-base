import { sinon } from '../../mocha'
import { MiniMongo } from './minimongo'
import { MockApiRegistry } from './api'


export default () => {
  const {
    SimpleSchema,
    Roles,
  } = global
  global.Meteor.users = new MiniMongo.Collection('users')
  global.Meteor.roles = new MiniMongo.Collection('roles')
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
    },
    Roles,
  }
}
