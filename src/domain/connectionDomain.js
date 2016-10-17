import { observable, action, computed } from 'mobx'
import { app } from '@mindhive/di'


// REVISIT: Expose calls that are taking a long time to complete even if Meteor still saying 'connected'
// REVISIT: use an interval to get time until next connect attempt and display

const STARTUP_MS = 5000

class ConnectionDomain {

  callCounter = 0

  @observable startingUp = true
  @observable connected = true
  @observable _pendingCalls = []

  @computed get connectionDown() {
    return ! this.connected && ! this.startingUp
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

  @action setConnected = (connected) => {
    this.connected = connected
  }

  @action startupComplete = () => {
    this.startingUp = false
  }

  @action reconnect = () => {
    app().Meteor.reconnect()
  }
}

export default ({ Meteor, Tracker }) => {
  const connectionDomain = new ConnectionDomain()
  Meteor.setTimeout(connectionDomain.startupComplete, STARTUP_MS)
  Tracker.autorun(() => {
    connectionDomain.setConnected(Meteor.status().connected)
  })
  return {
    connectionDomain,
  }
}
