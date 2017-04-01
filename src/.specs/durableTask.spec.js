import some from '@mindhive/some'
import { mockAppContext, initModules, app } from '@mindhive/di'

import { sinon, should, forATick } from '../mocha'

import { TestGround } from '../test/mocks/TestMongo'
import mockMeteorCoreModuleFactory from '../test/mocks/mockMeteorCoreModuleFactory'
import mockClockModule from '@mindhive/time/mockClockModule'
import ProgressiveBackoff from '@mindhive/time/ProgressiveBackoff'
import durableTaskDomainModule from '../domain/durableTaskDomain'


describe('durableTaskDomain', () => {

  let taskFunc
  let expectedArgs

  beforeEach(() => {
    taskFunc = sinon.stub()
    expectedArgs = some.object()
  })

  const modules = () => initModules([
    mockMeteorCoreModuleFactory({ isClient: true }),
    mockClockModule,
    () => ({ ProgressiveBackoff }),
    ({ clock }) => {
      sinon.spy(clock, 'sleep')
      return {
        Ground: TestGround,
      }
    },
  ])

  const givenDomainModuleInited = () => {
    if (! app().durableTaskDomain) {
      initModules([durableTaskDomainModule])
    }
  }

  const givenSomeTask = () => {
    givenDomainModuleInited()
    app().durableTaskDomain.registerExecutor({
      taskRef: 'someTask',
      executor: taskFunc,
    })
  }

  const whenAddTask = (args = expectedArgs) => {
    return app().durableTaskDomain.addTask({
      taskRef: 'someTask',
      args,
    })
  }

  it('should throw if attempt to register same taskRef twice',
    mockAppContext(modules, async () => {
      givenSomeTask()
      should.throw(() => {
        givenSomeTask()
      })
    })
  )

  // REVISIT: Dunno why this causes unhandled rejection?
  // it('should throw if attempt to addTask not registered',
  //   mockAppContext(modules, async () => {
  //     givenDomainModuleInited()
  //     await whenAddTask().should.be.rejected
  //   })
  // )

  it('should throw executor is not a fucntion',
    mockAppContext(modules, async () => {
      givenDomainModuleInited()
      should.throw(() => {
        app().durableTaskDomain.registerExecutor({
          taskRef: 'someTask',
          executor: null,
        })
      })
    })
  )

  it('should call task when added',
    mockAppContext(modules, async ({ clock }) => {
      givenSomeTask()
      whenAddTask()

      taskFunc.should.have.been.calledOnce
      taskFunc.should.have.been.calledWith(expectedArgs)
      clock.sleep.should.not.have.been.called
    })
  )

  it('should call task again when it throws',
    mockAppContext(modules, async ({ clock }) => {
      givenSomeTask()
      taskFunc.onFirstCall().throws(new some.Exception())
      taskFunc.onSecondCall().returns(undefined)
      await whenAddTask()

      taskFunc.should.have.been.calledTwice
      clock.sleep.should.have.been.calledOnce
    })
  )

  it('should call task again when returned promise rejects',
    mockAppContext(modules, async ({ clock }) => {
      givenSomeTask()
      const firstPromise = taskFunc.returnsPromise()
      const addPromise = whenAddTask()
      firstPromise.rejects(new some.Exception())
      const secondPromise = taskFunc.returnsPromise()
      secondPromise.resolves()
      await addPromise

      taskFunc.should.have.been.calledTwice
      clock.sleep.should.have.been.calledOnce
    })
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
    })
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
    })
  )

  it('should execute tasks left over from last run on startup',
    mockAppContext(modules, async ({ Ground }) => {
      const DurableTasks = new Ground.Collection('durableTasks')
      DurableTasks.insert({
        taskRef: 'someTask',
        args: expectedArgs,
      })
      givenDomainModuleInited()
      givenSomeTask()

      await forATick()
      taskFunc.should.have.been.calledOnce
      taskFunc.should.have.been.calledWith(expectedArgs)
    })
  )

  it('should not try to execute left over tasks until their executor is registered',
    mockAppContext(modules, async ({ Ground }) => {
      const DurableTasks = new Ground.Collection('durableTasks')
      DurableTasks.insert({
        taskRef: 'someTask',
        args: expectedArgs,
      })
      givenDomainModuleInited()

      await forATick()
      taskFunc.should.not.have.been.called
    })
  )

})
