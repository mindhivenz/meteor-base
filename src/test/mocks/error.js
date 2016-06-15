
/*
Mimicking the built in Meteor.Error

Note: intentionally does not extend Error to avoid problems with Babel transpiling
and extending built-in classes.
See: https://stackoverflow.com/questions/33870684/why-doesnt-instanceof-work-on-instances-of-error-subclasses-under-babel-node
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
