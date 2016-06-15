

/*
Mimicks the built in Meteor.Error
 */
export class MockError extends Error {
  constructor(error, reason, details) {
    super()
    this.error = error
    this.reason = reason
    this.details = details
    if (this.reason) {
      this.message = `${this.reason} [${this.error}]`
    } else {
      this.message = `[${this.error}]`
    }
  }
}
