import { observable, action, computed } from 'mobx'
import { app } from '@mindhive/di'
import debounce from 'lodash/debounce'

// REVISIT: Expose calls that are taking a long time to complete even if Meteor still saying 'connected'
// REVISIT: use an interval to get time until next connect attempt and display

class ServerCall {

  viewerWaitingOnResult
  @observable notifyViewer = false

  constructor({
    viewerWaitingOnResult = false,
    notifyViewerAfterRunningMs = viewerWaitingOnResult ? 1000 : 2000,
  } = {}) {
    this.viewerWaitingOnResult = viewerWaitingOnResult
    this._notifyViewerTimer = setTimeout(this.setNotifyViewer, notifyViewerAfterRunningMs)
  }

  @action.bound setNotifyViewer() {
    this.notifyViewer = true
    this._notifyViewerTimer = null
  }

  stop() {
    if (this._notifyViewerTimer) {
      clearTimeout(this._notifyViewerTimer)
      this._notifyViewerTimer = null
    }
  }
}

class ConnectionStore {

  @observable statusKnown = false
  @observable connected = true
  @observable _callsInProgress = []

  @computed get connectionDown() {
    return ! this.connected && this.statusKnown
  }

  @computed get backgroundComms() {
    return this._callsInProgress.some(c => ! this.connected || c.notifyViewer)
  }

  @computed get callInProgress() {
    return this._callsInProgress.some(c => c.viewerWaitingOnResult && (! this.connected || c.notifyViewer))
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

  @action('setConnected') _setConnectedBebounced = debounce(
    (connected) => { this.connected = connected },
    300,
  )

  @action _setStatus(status) {
    this._setConnectedBebounced(status.connected)
    if (status.connected || status.status === 'waiting' || status.retryCount) {
      this.statusKnown = true
    }
  }

  @action reconnect() {
    app().Meteor.reconnect()
  }
}

export default ({ Meteor, Tracker }) => {
  const connectionStore = new ConnectionStore()
  Tracker.autorun(() => {
    connectionStore._setStatus(Meteor.status())
  })
  return {
    connectionStore,
  }
}
