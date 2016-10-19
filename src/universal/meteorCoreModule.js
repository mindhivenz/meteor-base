import { ApiRegistry } from '../apiRegistry'
import { Api } from '../client/api'


export default () => {
  const {
    Meteor,
    Tracker,
    Mongo,
    Accounts,
    Random,
  } = global  // Import like this so it can be used in Wallaby
  const Users = Meteor.users
  const result = {
    Meteor,
    Tracker,
    Users,
    Mongo,
    Accounts,
    Random,
    apiRegistry: new ApiRegistry(Meteor),
  }
  if (Meteor.isClient) {
    result.api = new Api()
  }
  return result
}
