import some from '@mindhive/some'

import '../mocha'

import { ValidationError } from './error'

describe('ValidationError', () => {

  it('should pass fieldErrors as details', () => {
    const fieldErrors = some.object()
    const err = new ValidationError(fieldErrors)
    err.error.should.equal(ValidationError.ERROR_CODE)
    err.details.should.equal(fieldErrors)
  })

  it('should return field error messages as reason', () => {
    const message1 = some.string()
    const message2 = some.string()
    const err = new ValidationError({
      field1: message1,
      field2: message2,
    })
    err.reason.should.contain(message1)
    err.reason.should.contain(message2)
  })

})
