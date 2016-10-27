import { TimeSync } from 'meteor/mizzao:timesync'

/* eslint-disable no-console */

export default () => ({
  clock: () => {
    const serverTime = TimeSync.serverTime()
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
