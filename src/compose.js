import { compose, composeWithTracker } from 'react-komposer'
import { inject } from '@mindhive/di'


const Empty = () => null

export const withAsync = (asyncFunc, shouldResubscribe) =>
  compose(
    inject((appContext, ownProps, onData) => {
      const pushProps = (props = {}) =>
        onData(null, props)
      asyncFunc(appContext, pushProps, ownProps)
    }),
    Empty,
    null,
    { shouldResubscribe },
  )

/*
 Inside meteorDataUsingFunc calls to Meteor reactive calls are tracked,
 and meteorDataUsingFunc rerun if the result of those Meteor calls changes

 meteorDataUsingFunc: (appContext, pushProps, ownProps)

 Call pushProps with the props to push to the child component.

 Note: we don't use the loading and error component of react-komposer.
 Push that data through props to handle it nicely.
 */
export const withLiveData = (meteorDataUsingFunc) =>
  composeWithTracker(
    inject((appContext, ownProps, onData) => {
      const pushProps = (props = {}) =>
        onData(null, props)
      meteorDataUsingFunc(appContext, pushProps, ownProps)
    }),
    Empty,
  )
