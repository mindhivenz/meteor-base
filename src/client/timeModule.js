import { TimeSync } from 'meteor/mizzao:timesync'  // eslint-disable-line import/no-unresolved

/* eslint-disable no-console */

export default () => ({
  clock: (...args) => {
    const serverTime = TimeSync.serverTime(...args)
    if (! serverTime) {
      console.warn('clock() called before time synced with server, defaulting to browser/client time')
      if (console.trace) {
        console.trace()
      }
      return new Date()
    }
    return new Date(serverTime)
  },
})
