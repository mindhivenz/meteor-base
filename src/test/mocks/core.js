import { sinon } from '../../mocha'
import { MiniMongo } from './minimongo'
import { MockApiRegistry } from './api'


export default () => ({
  Meteor: {
    isServer: true,
  },
  Tracker: {},
  Mongo: MiniMongo,
  Users: new MiniMongo.Collection('users'),
  SimpleSchema: global.SimpleSchema,
  apiRegistry: new MockApiRegistry(),
  Accounts: {
    config: sinon.spy(),
  },
  Roles: {},
})
