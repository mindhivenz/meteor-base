import BaseProgressiveBackoff from '@mindhive/time/ProgressiveBackoff'
import { app } from '@mindhive/di'


export class ProgressiveBackoff extends BaseProgressiveBackoff {
  constructor(options) {
    super({
      clock: app().clock,
      ...options
    })
  }
}
