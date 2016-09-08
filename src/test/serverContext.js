import { mockAppContext } from '@mindhive/di/test'


const runInFiber = (func) =>
  (done) => {
    func.future()().resolve((err) => {
      done(err)
    })
  }

export const mockServerContext = (testModules, testFunc) =>
  runInFiber(mockAppContext(testModules, testFunc))
