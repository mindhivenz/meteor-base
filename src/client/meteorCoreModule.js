import { Api } from './api'
import { LocalStorage } from './storage'


export default () => {
  const trackerMobxAutorunPackage = global.Package && global.Package['space:tracker-mobx-autorun']
  const trackerMobxAutorun = trackerMobxAutorunPackage && {
    autorun(...args) {
      const sync = trackerMobxAutorunPackage.default(...args)
      sync.start()    // Make it match the call signature of Tracker.autorun
      return sync
    },
    pumpMongoToMobx: trackerMobxAutorunPackage.observe,
  }
  return {
    api: new Api(),
    Tracker: trackerMobxAutorun || global.Tracker,
    storage: new LocalStorage(),
  }
}
