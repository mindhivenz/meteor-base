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

})
