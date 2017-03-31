import { app } from '@mindhive/di'


export default (message) => {
  const { Meteor } = app()
  if (Meteor.isDevelopment) {
    throw new Error(message)
  }
}

