import {
  observable,
  action,
  computed,
  when,
} from 'mobx'
import { app } from '@mindhive/di'
import debounce from 'lodash/debounce'


class ServerCall {

  viewerWaitingOnResult
  @observable notifyViewer = false
  @observable inProgress = true

  constructor(
    {
      viewerWaitingOnResult = false,
      notifyViewerAfterRunningMs = viewerWaitingOnResult ? 1000 : 2000,
    } = {},
    store,
  ) {
    this.viewerWaitingOnResult = viewerWaitingOnResult
    this.store = store
    this._notifyViewerTimer = setTimeout(this.setNotifyViewer, notifyViewerAfterRunningMs)
  }

  @action.bound setNotifyViewer() {
    this.notifyViewer = true
    this._notifyViewerTimer = null
  }

  @action stop() {
    this.inProgress = false
    this.store._callsInProgress.remove(this)
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

  _offlineMessage = null

  @computed get connectionDown() {
    return ! this.connected && this.statusKnown
  }

  @computed get backgroundComms() {
    return this._callsInProgress.some(c => ! c.viewerWaitingOnResult && (! this.connected || c.notifyViewer))
  }

  @computed get callInProgress() {
    return this._callsInProgress.some(c => c.viewerWaitingOnResult && (! this.connected || c.notifyViewer))
  }

  @action callStarted(options) {
    const serverCall = new ServerCall(options, this)
    this._callsInProgress.push(serverCall)
    if (this.connectionDown) {
      this._addOfflineMessage()
    }
    return serverCall
  }

  _setConnectedBebounced = debounce(
    action('setConnected', (connected) => {
      this.connected = connected
      if (! connected && this.callInProgress) {
        this._addOfflineMessage()
      }
    }),
    300,
  )

  _addOfflineMessage() {
    const { systemMessageStore } = app()
    if (! this._offlineMessage) {
      this._offlineMessage = systemMessageStore.addMessage({
        message: 'You are offline, your work will be saved once reconnected',
        cancelWhen: () => this.connected || this._callsInProgress.length === 0,  // Check empty array as well as connected is debounced
      })
      when(
        'Clear _offlineMessage',
        () => ! this._offlineMessage.show,
        () => { this._offlineMessage = null },
      )
    }
  }

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
