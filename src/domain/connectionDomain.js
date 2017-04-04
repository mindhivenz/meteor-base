import { observable, action, computed } from 'mobx'
import { app } from '@mindhive/di'

// REVISIT: Expose calls that are taking a long time to complete even if Meteor still saying 'connected'
// REVISIT: use an interval to get time until next connect attempt and display

class ServerCall {

  viewerWaitingOnResult
  @observable runningTooLong = false

  constructor({
    viewerWaitingOnResult,
    runTooLongMs = viewerWaitingOnResult ? 1000 : 2000,
  } = {}) {
    this.viewerWaitingOnResult = viewerWaitingOnResult
    this._runningTooLongTimer = setTimeout(this.setRunningTooLong, runTooLongMs)
  }

  @action.bound setRunningTooLong() {
    this.runningTooLong = true
    this._runningTooLongTimer = null
  }

  stop() {
    if (this._runningTooLongTimer) {
      clearTimeout(this._runningTooLongTimer)
      this._runningTooLongTimer = null
    }
  }
}

class ConnectionDomain {

  @observable statusKnown = false
  @observable connected = true
  @observable _callsInProgress = []

  @computed get connectionDown() {
    return ! this.connected && this.statusKnown
  }

  @computed get callRunningTooLong() {
    return this._callsInProgress.some(c => ! this.connected || c.runningTooLong)
  }

  @computed get viewerWaitingTooLong() {
    return this._callsInProgress.some(c => c.viewerWaitingOnResult && (! this.connected || c.runningTooLong))
  }

  @action callStarted(options) {
    const serverCall = new ServerCall(options)
    this._callsInProgress.push(serverCall)
    return serverCall
  }

  @action callFinished(serverCall) {
    this._callsInProgress.remove(serverCall)
    serverCall.stop()
  }

  @action _setStatus(status) {
    this.connected = status.connected
    if (status.connected || status.status === 'waiting' || status.retryCount) {
      this.statusKnown = true
    }
  }

  @action reconnect() {
    app().Meteor.reconnect()
  }
}

export default ({ Meteor, Tracker }) => {
  const connectionDomain = new ConnectionDomain()
  Tracker.autorun(() => {
    connectionDomain._setStatus(Meteor.status())
  })
  return {
    connectionDomain,
  }
}
