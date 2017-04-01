import Api from './Api'
import LocalStorage from './LocalStorage'
import Tracker from './Tracker'
import MongoMirror from './MongoMirror'


export default () => ({
  api: new Api(),
  Tracker: new Tracker(),
  mongoMirror: new MongoMirror(),
  storage: new LocalStorage(),
})
