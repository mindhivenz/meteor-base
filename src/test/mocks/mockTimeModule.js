import addMilliseconds from 'date-fns/add_milliseconds'

import { extendClock, ProgressiveBackoff } from '../../universal/time'


export default () => {
  const initialTime = new Date()
  let testTime = initialTime

  const clock = () => testTime

  clock.adjust = (func) => {
    testTime = func(testTime)
    return testTime
  }
  clock.sleep = async (milliseconds) => {
    clock.adjust(time => addMilliseconds(time, milliseconds))
  }
  clock.totalAdjustedMs = () =>
    testTime - initialTime

  extendClock(clock)

  return {
    clock,
    ProgressiveBackoff,
  }
}
