import { TimeSync } from 'meteor/mizzao:timesync'

import { extendClock } from '../universal/time'

/* eslint-disable no-console */

let warnedOfEarlyCall = false

const clock = () => {
  const serverTime = TimeSync.serverTime()
  if (! serverTime) {
    if (! warnedOfEarlyCall) {
      (console.trace || console.warn)(
        'clock() called before time synced with server, defaulting to browser/client time'
      )
      warnedOfEarlyCall = true
    }
    return new Date()
  }
  return new Date(serverTime)
}

extendClock(clock)

export default () => ({
  clock,
})
