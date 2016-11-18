import { Api } from './api'
import { LocalStorage } from './storage'
import { buildTracker } from './tracker'


export default () => ({
  api: new Api(),
  Tracker: buildTracker(),
  storage: new LocalStorage(),
})
