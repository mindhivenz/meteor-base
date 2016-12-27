import { TestMongo, resetTestGroundCollections } from './testMongo'
import { MockApiRegistry } from './mockApiRegistry'
import { MockTracker } from './mockTracker'
import { MockMongoMirror } from './mockMongoMirror'


const possiblyRunTimerFuncInFiber = timer =>
  (func, timeout = 0) => {
    const wasInFiber = require('fibers').current  // eslint-disable-line global-require
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
    const isDevelopment = process.env.NODE_ENV === 'development'
    const result = {
      Meteor: {
        isClient,
        isServer,
        isCordova,
        isDevelopment,
        isProduction: ! isDevelopment,
        wrapAsync: Meteor.wrapAsync,
        defer: possiblyRunTimerFuncInFiber(setTimeout),
        startup: possiblyRunTimerFuncInFiber(setTimeout),
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
