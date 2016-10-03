import { mockAppContext } from '@mindhive/di/test'


const inFiberTestRunner = (func) =>
  (done) => {
    func.future()().resolve((err) => {
      done(err)
    })
  }

export const mockServerContext = (testModules, testFunc) =>
  inFiberTestRunner(mockAppContext(testModules, testFunc))
