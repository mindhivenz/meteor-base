import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiProperties from 'chai-properties'
import chaiAsPromised from 'chai-as-promised'
import sinonStubPromise from 'sinon-stub-promise'

import chaiPlugin from './test/chaiPlugin'

const should = chai.should()

chai.use(sinonChai)
chai.use(chaiProperties)
chai.use(chaiAsPromised)
chai.use(chaiPlugin)

sinonStubPromise(sinon)

export { sinon, should }

export const tick = () =>
  new Promise((resolve) => {
    setImmediate(resolve)
  })

// sinon.addBehavior('returnsPromise', (fake) => {
//   new Promise((resolve, reject) => {  // eslint-disable-line no-new
//     fake.resolves = resolve
//     fake.rejects = reject
//   })
// })
