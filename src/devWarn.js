import { app } from '@mindhive/di'


export default (message) => {
  const { Meteor } = app()
  if (Meteor.isDevelopment) {
    console.warn(message)  // eslint-disable-line no-console
  }
}

