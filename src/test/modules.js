import mockMeteorCoreModule from './mocks/core'


export const mockInitModules = (...contextAndModules) =>
  () => {
    const meteorCoreContext = mockMeteorCoreModule()
    const passedContext = typeof contextAndModules[0] !== 'function'
    const [context, ...modules] = passedContext ? contextAndModules : [{}, ...contextAndModules]
    const resultContext = {
      ...meteorCoreContext,
      ...context,
    }
    modules.forEach(module => {
      const moduleContext = module(resultContext)
      Object.assign(resultContext, moduleContext)
    })
    return resultContext
  }
