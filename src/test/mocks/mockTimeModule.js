import { initModules } from '@mindhive/di'
import mockClockModule from '@mindhive/time/mockClockModule'
import ProgressiveBackoff from '@mindhive/time/ProgressiveBackoff'


export default () => {
  initModules([mockClockModule])
  return {
    ProgressiveBackoff,
  }
}
