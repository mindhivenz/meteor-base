import addMilliseconds from 'date-fns/add_milliseconds'

import { extendClock } from '../../universal/time'


export default () => {
  let testTime = new Date()
  const clock = () => testTime

  clock.adjust = (func) => {
    testTime = func(testTime)
    return testTime
  }
  clock.sleep = async (milliseconds) => {
    clock.adjust(time => addMilliseconds(time, milliseconds))
  }

  extendClock(clock)

  return {
    clock,
  }
}
