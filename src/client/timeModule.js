import { extendClock, ProgressiveBackoff } from '../universal/time'


const TimeSync = global.TimeSync

const localClock = () => new Date()

const serverSyncClock = () => {
  const serverTime = global.Tracker.nonreactive(() => TimeSync.serverTime())
  if (! serverTime) {
    console.warn('clock() called before time synced with server, defaulting to browser/client time')  // eslint-disable-line no-console
    return localClock()
  }
  return new Date(serverTime)
}

export default () => ({
  clock: extendClock(TimeSync ? serverSyncClock : localClock),
  ProgressiveBackoff,
})
