import 'babel-polyfill'
import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiProperties from 'chai-properties'
import chaiAsPromised from 'chai-as-promised'
import sinonStubPromise from 'sinon-stub-promise'

const should = chai.should()

sinonStubPromise(sinon)

chai.use(sinonChai)
chai.use(chaiProperties)
chai.use(chaiAsPromised)

export { sinon, should }
