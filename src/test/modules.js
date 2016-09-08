import { initModules } from '@mindhive/di'

import mockMeteorCoreModule from './mocks/meteorCoreModule'


export const mockInitModules = (...modules) =>
  () => {
    initModules([mockMeteorCoreModule, ...modules])
  }
