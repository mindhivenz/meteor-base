import { initModules as superInitModules } from '@mindhive/di'

import meteorCoreModule from './meteorCore'

/*
 A module should be defined as the index.js in a directory with a default export of
 a function (appContext).

 A module can add to the appContext by returning an object from this function where
 the properties are the names and objects to add to the appContext. For example:

 export default ({ existingService }) => { newService: new Service(existingService) }

 Both the server and client should call initModules() from their main.js(x).

 The order is important as each module adds new services into the context, and then
 the context is passed into the next module. Also, the module functions will be called
 honoring Meteor.startup().

 Don't forget that all modules under imports/api/... should be included in both client
 and server since Meteor methods and Mongo collections exist on both client and server.

 The client and server main files should perform all of their setup through initModules.
 */

let coreApplied = false

export const initModules = (modules) => {
  Meteor.startup(() => {
    if (! coreApplied) {
      superInitModules([meteorCoreModule])
      coreApplied = true
    }
    superInitModules(modules)
  })
}

