import { app } from '@mindhive/di'


export const extendClock = (clock) => {
  if (typeof clock.sleep === 'undefined') {
    clock.sleep = (milliseconds) =>
      new Promise(resolve =>
        app().Meteor.setTimeout(resolve, milliseconds)
      )
  }
}

export class ProgressiveBackoff {

  constructor({
    initialMs = 1,
    collisionAvoidanceMaxRandomMs = 500,
    retryMultiplier = 2,
    maxMs = 10 * 60 * 1000,
  } = {}) {
    this.initialMs = Math.max(initialMs, 1)
    this.collisionAvoidanceMaxRandomMs = collisionAvoidanceMaxRandomMs
    this.retryMultiplier = retryMultiplier
    this.maxMs = maxMs
    this.reset()
  }

  sleep() {
    const { Random, clock } = app()
    const delayMs = this.baseDelayMs + (this.collisionAvoidanceMaxRandomMs * Random.fraction())
    this.baseDelayMs = delayMs * this.retryMultiplier
    if (this.maxMs && this.baseDelayMs > this.maxMs) {
      this.baseDelayMs = this.maxMs
    }
    return clock.sleep(delayMs)
  }

  reset() {
    this.baseDelayMs = this.initialMs
  }
}

