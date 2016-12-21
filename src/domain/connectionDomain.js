import { observable, action, computed } from 'mobx'
import { app } from '@mindhive/di'

/* globals _ */

// REVISIT: Expose calls that are taking a long time to complete even if Meteor still saying 'connected'
// REVISIT: use an interval to get time until next connect attempt and display

class ConnectionDomain {

  callCounter = 0

  @observable statusKnown = false
  @observable connected = true
  @observable _pendingCalls = []
  @observable _setConnectedDebounceCount = 0

  @computed get _connectionStatusJittering() {
    return this._setConnectedDebounceCount > 10
  }

  @computed get connectionDown() {
    return (! this.connected || this._connectionStatusJittering) && this.statusKnown
  }

  @computed get hasPendingCalls() {
    return ! this.connected && this._pendingCalls.length > 0
  }

  @action callStarted = () => {
    this.callCounter += 1
    const callRecord = this.callCounter
    this._pendingCalls.push(callRecord)
    return () => this.callFinished(callRecord)
  }

  @action callFinished = (callRecord) => {
    this._pendingCalls.remove(callRecord)
  }

  _setConnected = _.debounce(action('setConnected', connected => {
    this.connected = connected
    this._setConnectedDebounceCount = 0
  }), 500)

  @action setStatus = (status) => {
    this._setConnected(status.connected)
    this._setConnectedDebounceCount += 1
    if (status.connected || status.status === 'waiting' || status.retryCount) {
      this.statusKnown = true
    }
  }

  @action reconnect = () => {
    app().Meteor.reconnect()
  }
}

export default ({ Meteor, Tracker }) => {
  const connectionDomain = new ConnectionDomain()
  Tracker.autorun(() => {
    connectionDomain.setStatus(Meteor.status())
  })
  return {
    connectionDomain,
  }
}
