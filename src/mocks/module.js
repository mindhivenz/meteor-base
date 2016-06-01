import { MiniMongo } from './minimongo'
import { MockApiRegistry } from './api'


const meteorCoreContext = {
  Meteor: {
    isServer: true,
  },
  Tracker: {},
  Mongo: MiniMongo,
  Users: new MiniMongo.Collection('users'),
  SimpleSchema: global.SimpleSchema,
  apiRegistry: new MockApiRegistry(),
}

export const mockInitModules = (...contextAndModules) => {
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
