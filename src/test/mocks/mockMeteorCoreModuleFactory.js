import { TestMongo } from './testMongo'
import { MockApiRegistry } from './mockApiRegistry'
import { MockTracker } from './mockTracker'
import { MockMongoMirror } from './mockMongoMirror'


const possiblyRunTimerFuncInFiber = timer =>
  (func, timeout) => {
    const wasInFiber = require('fibers').current
    return timer(
      () => {
        if (wasInFiber) {
          func.future()().resolve((err) => {
            if (err) {
              throw err
            }
          })
        } else {
          func()
        }
      },
      timeout,
    )
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
      Meteor: {
        isClient,
        isServer,
        isCordova,
        wrapAsync: Meteor.wrapAsync,
        defer: func => Meteor.setTimeout(func, 0),
        setTimeout: possiblyRunTimerFuncInFiber(setTimeout),
        clearTimeout,
        setInterval: possiblyRunTimerFuncInFiber(setInterval),
        clearInterval,
      },
      Mongo: TestMongo,
      Users: Accounts.users,
      apiRegistry: new MockApiRegistry(),
      Accounts,
      Random,
    }
    if (isClient) {
      Object.assign(result, {
        Tracker: new MockTracker(),
        mongoMirror: new MockMongoMirror(),
        api: {},
      })
    }
    return result
  }