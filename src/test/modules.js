import { initModules } from '@mindhive/di'

import mockMeteorCoreModule from './mocks/meteorCoreModule'


export const mockInitModules = (...modules) => {
  const preModules = [mockMeteorCoreModule]
  const moduleInit = () => {
    initModules([...preModules, ...modules])
  }
  moduleInit.preModules = preModules
  return moduleInit
}
