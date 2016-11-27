import { ApiRegistry } from '../apiRegistry'


export default () => {
  const {
    Meteor,
    Mongo,
    Accounts,
    Random,
  } = global  // Import like this so it can be used in Wallaby
  const Users = Meteor.users
  if (Meteor.isServer) {
    // REVISIT: Until we're on Node 6.6, we need to do this ourselves
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
    apiRegistry: new ApiRegistry(Meteor),
  }
  return result
}
