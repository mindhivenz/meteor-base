import ApiRegistry from '../server/ApiRegistry'
import ClientApiRegistry from '../client/ClientApiRegistry'


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
