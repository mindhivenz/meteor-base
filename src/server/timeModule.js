import { initModules } from '@mindhive/di'
import clockModule from '@mindhive/time/clockModule'
import ProgressiveBackoff from '@mindhive/time/ProgressiveBackoff'


export default () => {
  initModules([clockModule])
  return {
    ProgressiveBackoff,
  }
}
