
/*
Mimicking the built in Meteor.Error
 */
export class MockMeteorError {
  constructor(error, reason, details) {
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
