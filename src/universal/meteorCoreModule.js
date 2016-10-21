import { ApiRegistry } from '../apiRegistry'


export default () => {
  const {
    Meteor,
    Mongo,
    Accounts,
    Random,
  } = global  // Import like this so it can be used in Wallaby
  const Users = Meteor.users
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
