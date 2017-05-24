import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiProperties from 'chai-properties'
import chaiAsPromised from 'chai-as-promised'

const should = chai.should()

chai.use(sinonChai)
chai.use(chaiProperties)
chai.use(chaiAsPromised)

export { sinon, should }

export const tick = () =>
  new Promise((resolve) => { setImmediate(resolve) })

sinon.addBehavior('returnsPromise', (fake) => {
  new Promise((resolve, reject) => {  // eslint-disable-line no-new
    fake.resolves = resolve
    fake.rejects = reject
  })
})
