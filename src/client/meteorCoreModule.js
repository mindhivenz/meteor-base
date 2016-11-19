import { Api } from './api'
import { LocalStorage } from './storage'
import { Tracker } from './tracker'


export default () => ({
  api: new Api(),
  Tracker,
  storage: new LocalStorage(),
})
