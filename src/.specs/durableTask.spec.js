import some from '@mindhive/some'
import { mockAppContext, initModules, app } from '@mindhive/di'
import mockClockModule from '@mindhive/time/mockClockModule'
import ProgressiveBackoff from '@mindhive/time/ProgressiveBackoff'

import { sinon, should, tick } from '../mocha'

import { TestGround } from '../test/mocks/TestMongo'
import mockMeteorCoreModuleFactory from '../test/mocks/mockMeteorCoreModuleFactory'
import durableTaskStoreModule from '../store/durableTaskStore'


describe('durableTaskStore', () => {

  let taskFunc
  let expectedArgs
  let callStartedResult

  beforeEach(() => {
    taskFunc = sinon.stub()
    expectedArgs = some.object()
    callStartedResult = {
      stop: sinon.spy(),
    }
  })

  const modules = () => initModules([
    mockMeteorCoreModuleFactory({ isClient: true }),
    mockClockModule,
    () => ({ ProgressiveBackoff }),
    ({ clock }) => {
      sinon.spy(clock, 'sleep')
      return {
        Ground: TestGround,
        connectionStore: {
          callStarted: sinon.stub().returns(callStartedResult),
        },
      }
    },
  ])

  const givenDomainModuleInited = () => {
    if (! app().durableTaskStore) {
      initModules([durableTaskStoreModule])
    }
  }

  const givenSomeTask = () => {
    givenDomainModuleInited()
    app().durableTaskStore.registerExecutor({
      taskRef: 'someTask',
      executor: taskFunc,
    })
  }

  const whenAddTask = (args = expectedArgs) =>
    app().durableTaskStore.addTask({
      taskRef: 'someTask',
      args,
    })

  it('should throw if attempt to register same taskRef twice',
    mockAppContext(modules, async () => {
      givenSomeTask()
      should.throw(() => {
        givenSomeTask()
      })
    }),
  )

  it('should throw if attempt to addTask not registered',
    mockAppContext(modules, async () => {
      givenDomainModuleInited()
      await whenAddTask().should.be.rejected
    })
  )

  it('should throw executor is not a function',
    mockAppContext(modules, async () => {
      givenDomainModuleInited()
      should.throw(() => {
        app().durableTaskStore.registerExecutor({
          taskRef: 'someTask',
          executor: null,
        })
      })
    }),
  )

  it('should call task when added',
    mockAppContext(modules, async ({ clock, connectionStore }) => {
      givenSomeTask()
      await whenAddTask()

      taskFunc.should.have.been.calledOnce
      taskFunc.should.have.been.calledWith(expectedArgs)
      clock.sleep.should.not.have.been.called
      connectionStore.callStarted.should.have.been.calledOnce
      callStartedResult.stop.should.have.been.calledOnce
    }),
  )

  it('should call task again when it throws',
    mockAppContext(modules, async ({ clock, connectionStore }) => {
      givenSomeTask()
      taskFunc.onFirstCall().throws()
      await whenAddTask()

      taskFunc.should.have.been.calledTwice
      clock.sleep.should.have.been.calledOnce
      connectionStore.callStarted.should.have.been.calledOnce
      callStartedResult.stop.should.have.been.calledOnce
    }),
  )

  it('should call task again when returned promise rejects',
    mockAppContext(modules, async ({ clock, connectionStore }) => {
      givenSomeTask()
      const firstPromise = taskFunc.returnsPromise()
      const addPromise = whenAddTask()
      firstPromise.rejects(new some.Exception())
      await tick()
      const secondPromise = taskFunc.returnsPromise()
      secondPromise.resolves()
      await addPromise

      taskFunc.should.have.been.calledTwice
      clock.sleep.should.have.been.calledOnce
      connectionStore.callStarted.should.have.been.calledOnce
      callStartedResult.stop.should.have.been.calledOnce
    }),
  )

  it('should persist tasks',
    mockAppContext(modules, async () => {
      const otherArgs = some.object()
      givenSomeTask()
      const promise = taskFunc.returnsPromise()
      const tasks = Promise.all([
        whenAddTask(),
        whenAddTask(otherArgs),
      ])

      app().DurableTasks.find().fetch().should.have.properties([
        {
          taskRef: 'someTask',
          args: expectedArgs,
        },
        {
          taskRef: 'someTask',
          args: otherArgs,
        },
      ])
      promise.resolves()
      await tasks
    }),
  )

  it('should cleanup persisted tasks when complete successfully',
    mockAppContext(modules, async () => {
      const otherArgs = some.object()
      givenSomeTask()
      const promise = taskFunc.returnsPromise()
      const tasks = Promise.all([
        whenAddTask(),
        whenAddTask(otherArgs),
      ])

      promise.resolves()
      await tasks
      app().DurableTasks.find().count().should.equal(0)
    }),
  )

  it('should execute tasks left over from last run on startup',
    mockAppContext(modules, async ({ Ground, connectionStore }) => {
      const DurableTasks = new Ground.Collection('durableTasks')
      DurableTasks.insert({
        taskRef: 'someTask',
        args: expectedArgs,
      })
      givenDomainModuleInited()
      givenSomeTask()
      await new Promise((resolve) => {DurableTasks.once('loaded', resolve)})

      taskFunc.should.have.been.calledOnce
      taskFunc.should.have.been.calledWith(expectedArgs)
      connectionStore.callStarted.should.have.been.calledOnce
      callStartedResult.stop.should.have.been.calledOnce
    }),
  )

  it('should not try to execute left over tasks until their executor is registered',
    mockAppContext(modules, async ({ Ground }) => {
      const DurableTasks = new Ground.Collection('durableTasks')
      DurableTasks.insert({
        taskRef: 'someTask',
        args: expectedArgs,
      })
      givenDomainModuleInited()

      await tick()
      taskFunc.should.not.have.been.called
    }),
  )

})
