import extendClock from '@mindhive/time/extendClock'
import ProgressiveBackoff from '@mindhive/time/ProgressiveBackoff'


const TimeSync = global.TimeSync

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

export default () => ({
  clock: extendClock(TimeSync ? serverSyncClock : localClock),
  ProgressiveBackoff,
})
