import { Api } from './api'
import { LocalStorage } from './storage'
import { Tracker } from './tracker'
import { MongoMirror } from './mongoMirror'


export default () => ({
  api: new Api(),
  Tracker: new Tracker(),
  mongoMirror: new MongoMirror(),
  storage: new LocalStorage(),
})
