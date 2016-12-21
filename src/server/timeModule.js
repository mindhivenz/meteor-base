import { extendClock, ProgressiveBackoff } from '../universal/time'


const clock = () => new Date()

export default () => ({
  clock: extendClock(clock),
  ProgressiveBackoff,
})
