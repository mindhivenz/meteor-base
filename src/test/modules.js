import mockMeteorCoreModule from './mocks/core'


export const mockInitModules = (...modules) =>
  () => {
    const resultContext = {}
    const allModules = [mockMeteorCoreModule, ...modules]
    allModules.forEach(module => {
      const newContext = module(resultContext)
      if (newContext) {
        Object.assign(resultContext, newContext)
      }
    })
    return resultContext
  }
