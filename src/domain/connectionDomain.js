import { observable, action, computed } from 'mobx'
import { app } from '@mindhive/di'


// REVISIT: Expose calls that are taking a long time to complete even if Meteor still saying 'connected'
// REVISIT: use an interval to get time until next connect attempt and display

class ConnectionDomain {

  callCounter = 0

  @observable statusKnown = false
  @observable connected = true
  @observable _pendingCalls = []

  @computed get connectionDown() {
    return ! this.connected && this.statusKnown
  }

  @computed get hasPendingCalls() {
    return ! this.connected && this._pendingCalls.length > 0
  }

  @action callStarted = () => {
    const callRecord = ++this.callCounter
    this._pendingCalls.push(callRecord)
    return () => this.callFinished(callRecord)
  }

  @action callFinished = (callRecord) => {
    this._pendingCalls.remove(callRecord)
  }

  @action setStatus = (status) => {
    this.connected = status.connected
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
