import { initModules } from '@mindhive/di'
import clockModule from '@mindhive/time/clockModule'
import { ProgressiveBackoff } from '../universal/ProgressiveBackoff'


export default () => {
  initModules([clockModule])
  return {
    ProgressiveBackoff,
  }
}
