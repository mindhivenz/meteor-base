import { app } from '@mindhive/di'


class DurableTaskStore {

  refMap = new Map()

  registerExecutor({ taskRef, executor }) {
    const { ProgressiveBackoff, DurableTasks } = app()
    if (this.refMap.has(taskRef)) {
      throw new Error(`Attempt to register taskRef '${taskRef}' twice`)
    }
    if (typeof executor !== 'function') {
      throw new Error('Invalid executor')
    }
    this.refMap.set(taskRef, {
      executor,
      backoff: new ProgressiveBackoff(),
    })
    // TODO: if multiple tabs then this should only be done in one of them! https://trello.com/c/RPK1iOX0
    DurableTasks.once('loaded', () => {
      DurableTasks.find().forEach((t) => {
        this._runTask(t._id, t)
      })
    })
  }

  addTask = (taskDef) => {
    const { DurableTasks } = app()
    const taskId = DurableTasks.insert(taskDef)
    return this._runTask(taskId, taskDef)
  }

  _runTask = async (taskId, { taskRef, args, ...serverCallOptions }) => {
    const { DurableTasks, connectionStore } = app()
    const task = this.refMap.get(taskRef)
    if (! task) {
      throw new Error(`Attempt to call unregistered taskRef '${taskRef}'`)
    }
    const { executor, backoff } = task
    const serverCall = connectionStore.callStarted(serverCallOptions)
    for (;;) {
      try {
        const result = await executor(args)
        backoff.reset()
        DurableTasks.remove(taskId)
        serverCall.stop()
        return result
      } catch (e) {
        console.warn(`Task ${taskRef} failed (will retry)`, e)  // eslint-disable-line no-console
        await backoff.sleep()
      }
    }
  }
}

export default ({ Ground }) => {
  const DurableTasks = new Ground.Collection('durableTasks')
  const durableTaskStore = new DurableTaskStore()
  return {
    DurableTasks,
    durableTaskStore,
  }
}
