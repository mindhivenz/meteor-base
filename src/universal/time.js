import { app } from '@mindhive/di'


export const extendClock = (clock) => {

  if (typeof clock.sleep === 'undefined') {
    clock.sleep = async (milliseconds) =>
      new Promise(resolve =>
        app().Meteor.setTimeout(resolve, milliseconds)
      )
  }

  clock.sleepRandom = async (maxMillisecond) =>
    clock.sleep(app().Random.fraction() * maxMillisecond)

}
