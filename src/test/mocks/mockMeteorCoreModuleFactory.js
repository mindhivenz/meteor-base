import TestMongo, { resetTestGroundCollections } from './TestMongo'
import MockApiRegistry from './MockApiRegistry'
import MockTracker from './MockTracker'
import MockMongoMirror from './MockMongoMirror'


class MockMeteor {

  constructor(props) {
    Object.assign(this, props)
  }

  _timerPromises = []

  _possiblyRunTimerFuncInFiber(timer, func, timeout = 0) {
    const wasInFiber = require('fibers').current  // eslint-disable-line global-require
    let resolve = null
    let reject = null
    const onlyCompletePromiseOnce = () => {
      resolve = () => {}
      reject = () => {}
    }
    this._timerPromises.push(new Promise((res, rej) => {
      resolve = res
      reject = rej
    }))
    return timer(
      () => {
        if (wasInFiber) {
          func.future()().resolve((err, res) => {
            if (err) {
              reject(err)
            } else {
              resolve(res)
            }
            onlyCompletePromiseOnce()
            if (err) {
              throw err
            }
          })
        } else {
          try {
            resolve(func())
          } catch (e) {
            reject(e)
            throw e
          } finally {
            onlyCompletePromiseOnce()
          }
        }
      },
      timeout,
    )
  }

  _derferredPromises() {
    return Promise.all(this._timerPromises)
  }

  isDevelopment = true
  isProduction = false

  wrapAsync = Meteor.wrapAsync
  defer(...args) { return this._possiblyRunTimerFuncInFiber(setTimeout, ...args) }
  startup(...args) { return this._possiblyRunTimerFuncInFiber(setTimeout, ...args) }
  setTimeout(...args) { return this._possiblyRunTimerFuncInFiber(setTimeout, ...args) }
  clearTimeout = clearTimeout
  setInterval(...args) { return this._possiblyRunTimerFuncInFiber(setInterval, ...args) }
  clearInterval = clearInterval
}


export default (
  {
    isClient = false,
    isServer = ! isClient,
    isCordova = false,
  } = {}
) =>
  () => {
    const {
      Meteor,
      Random,
      Accounts,
      EJSON,
    } = global
    Accounts.users = new TestMongo.Collection('users')
    Meteor.users = Accounts.users
    Accounts._options = {}
    if (isServer) {
      Accounts._loginHandlers = []
      Accounts._validateLoginHook.callbacks = {}
      Accounts._onLogoutHook.callbacks = {}
      delete Accounts._onCreateUserHook
    }
    const result = {
      Meteor: new MockMeteor({ isClient, isServer, isCordova }),
      Mongo: TestMongo,
      Users: Accounts.users,
      apiRegistry: new MockApiRegistry(),
      Accounts,
      Random,
      EJSON,
    }
    if (isClient) {
      resetTestGroundCollections()
      Object.assign(result, {
        Tracker: new MockTracker(),
        mongoMirror: new MockMongoMirror(),
        api: {},
      })
    }
    return result
  }
