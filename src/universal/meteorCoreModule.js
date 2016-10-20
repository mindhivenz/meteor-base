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
  const trackerMobxAutorunPackage = global.Package && global.Package['space:tracker-mobx-autorun']
  const trackerMobxAutorun = trackerMobxAutorunPackage && {
    autorun(...args) {
      const sync = trackerMobxAutorunPackage.default(...args)
      sync.start()    // Make it match the call signature of Tracker.autorun
      return sync
    },
    pumpMongoToMobx: trackerMobxAutorunPackage.observe,
  }
  const Users = Meteor.users
  const result = {
    Meteor,
    Tracker: trackerMobxAutorun || Tracker,
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
