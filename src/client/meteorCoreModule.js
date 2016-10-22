import { Api } from './api'
import { LocalStorage } from './storage'


const readySubscription = {
  ready: () => true,
}

const buildTracker = () => {
  const trackerMobxAutorunPackage = global.Package && global.Package['space:tracker-mobx-autorun']
  const trackerMobxAutorun = trackerMobxAutorunPackage && {
    autorun(...args) {
      const sync = trackerMobxAutorunPackage.default(...args)
      sync.start()    // Make it match the call signature of Tracker.autorun
      return sync
    },
    pumpMongoToMobx({
      actionPrefix,
      observableArray,
      subscription = readySubscription,
      mongoCursor,
    }) {
      trackerMobxAutorunPackage.observe(actionPrefix, observableArray, subscription, mongoCursor)
    },
  }
  return trackerMobxAutorun || global.Tracker
}

export default () => ({
  api: new Api(),
  Tracker: buildTracker(),
  storage: new LocalStorage(),
})
