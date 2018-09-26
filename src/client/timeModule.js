import extendClock from '@mindhive/time/extendClock'
import ProgressiveBackoff from '@mindhive/time/ProgressiveBackoff'

const { TimeSync } = global

const localClock = () => new Date()

let reportedCalledBeforeTimeSynced = false

const serverSyncClock = () => {
  const serverTime = global.Tracker.nonreactive(() => TimeSync.serverTime())
  if (! serverTime) {
    if (! reportedCalledBeforeTimeSynced) {
      console.log('clock() called before time synced with server, defaulting to browser/client time')  // eslint-disable-line no-console
      reportedCalledBeforeTimeSynced = true
    }
    return localClock()
  }
  return new Date(serverTime)
}

export default () => {
  const clock = extendClock(TimeSync ? serverSyncClock : localClock)

  class LocalClockProgressiveBackoff extends ProgressiveBackoff {
    constructor(options) {
      super({
        clock,
        ...options
      })
    }
  }

  return ({
    clock,
    ProgressiveBackoff: LocalClockProgressiveBackoff,
  })
}
