import mockMeteorCoreModule from './mocks/core'


export const mockInitModules = (...modules) =>
  () => {
    const resultContext = {}
    const allModules = [mockMeteorCoreModule, ...modules]
    allModules.forEach(module => {
      Object.assign(resultContext, module(resultContext))
    })
    return resultContext
  }
