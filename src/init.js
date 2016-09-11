import { initModules } from '@mindhive/di'

import meteorCoreModule from './meteorCoreModule'


/*
 See the docs for initModules() in @mindhive/di first

 Both the server and client should call initModules() from their main.js(x).

 The order is important as each module adds new services into the context, and then
 the context is passed into the next module. Also, the module functions will be called
 honoring Meteor.startup().

 The client and server main files should perform all of their setup through initModules().
 */

let coreApplied = false

export const initMeteorModules = (modules) => {
  Meteor.startup(() => {
    if (! coreApplied) {
      initModules([meteorCoreModule])
      coreApplied = true
    }
    initModules(modules)
  })
}

