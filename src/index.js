import * as di from '@mindhive/di'

import { initModules } from './init'
import { mockInitModules } from './mocks/module'
import { MinMongo } from './mocks/minimongo'


module.exports = {
  ...di,
  initModules,
}
Object.assign(module.exports.test, {
  mockInitModules,
  MinMongo,
})
