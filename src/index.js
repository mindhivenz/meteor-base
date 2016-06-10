import * as di from '@mindhive/di'

import { initModules } from './init'
import { mockInitModules } from './test/modules'
import { MiniMongo } from './test/mocks/minimongo'


module.exports = {
  ...di,
  initModules,
}
Object.assign(module.exports.test, {
  mockInitModules,
  MiniMongo,
})
