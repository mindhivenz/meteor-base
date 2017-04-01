import {
  autorun as mobxAutorun,
  untracked as mobxUntracked,
} from 'mobx'

// Based on https://github.com/meteor-space/tracker-mobx-autorun

export const meteorTracker = global.Tracker

export default class Tracker {

  autorun(func) {
    let mobxDisposer = null
    let computation = null
    let isFirstRun = true
    computation = meteorTracker.autorun(() => {
      if (mobxDisposer) {
        mobxDisposer()
        isFirstRun = true
      }
      mobxDisposer = mobxAutorun(() => {
        if (isFirstRun) {
          func()
        } else {
          computation.invalidate()
        }
        isFirstRun = false
      })
    })
    return {
      stop() {
        computation.stop()
        mobxDisposer()
      },
    }
  }

  untracked(func) {
    return meteorTracker.nonreactive(() => mobxUntracked(func))
  }

}
