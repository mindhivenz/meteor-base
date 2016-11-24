import { app } from '@mindhive/di'


export const extendClock = (clock) => {
  if (typeof clock.sleep === 'undefined') {
    clock.sleep = async (milliseconds) =>
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
    this.currentMs = Math.max(initialMs, 1)
    this.collisionAvoidanceMaxRandomMs = collisionAvoidanceMaxRandomMs
    this.retryMultiplier = retryMultiplier
    this.maxMs = maxMs
  }

  sleep() {
    const { Random, clock } = app()
    const delayMs = this.currentMs + (this.collisionAvoidanceMaxRandomMs * Random.fraction())
    this.currentMs = delayMs * this.retryMultiplier
    if (this.maxMs && this.currentMs > this.maxMs) {
      this.currentMs = this.maxMs
    }
    return clock.sleep(delayMs)
  }
}

