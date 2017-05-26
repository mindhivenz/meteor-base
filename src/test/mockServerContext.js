import { mockAppContext } from '@mindhive/di'


const inFiberAsPromise = func =>
  () =>
    new Promise((resolve, reject) => {
      func.future()().resolve((err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })

export default (testModules, testFunc) =>
  inFiberAsPromise(mockAppContext(testModules, testFunc))
