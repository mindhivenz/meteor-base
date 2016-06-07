import * as di from '@mindhive/di'

import { initModules } from './init'
import { mockInitModules } from './mocks/module'
import { MiniMongo } from './mocks/minimongo'


// REVISIT: Only do this in NODE_ENV=test
if (global.Meteor.isServer) {
  if (global.appContext) {
    throw new ReferenceError('appContext already defined in global')
  }
  global.appContext = di.test.appContext
}

module.exports = {
  ...di,
  initModules,
}
Object.assign(module.exports.test, {
  mockInitModules,
  MiniMongo,
})
