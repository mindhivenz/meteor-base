import { ApiRegistry } from '../server/apiRegistry'
import { ClientApiRegistry } from '../client/clientApiRegistry'


export default () => {
  const {
    Meteor,
    Mongo,
    Accounts,
    Random,
    EJSON,
    WebApp,
  } = global  // Import like this so it can be used in Wallaby
  const Users = Meteor.users
  if (Meteor.isServer) {
    // REVISIT: Until Meteor on Node 6.6, we need to do this ourselves
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled promise rejection', reason)  // eslint-disable-line no-console
    })
  }
  const result = {
    Meteor,
    Users,
    Mongo,
    Accounts,
    Random,
    EJSON,
    apiRegistry: Meteor.isServer ? new ApiRegistry(Meteor, WebApp) : new ClientApiRegistry(Meteor),
  }
  return result
}
