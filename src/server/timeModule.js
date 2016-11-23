import { extendClock } from '../universal/time'


const clock = () =>
  new Date()

extendClock(clock)

export default () => ({
  clock,
})
