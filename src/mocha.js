import 'babel-polyfill'
import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiProperties from 'chai-properties'

const should = chai.should()

chai.use(sinonChai)
chai.use(chaiProperties)

export { sinon, should }
