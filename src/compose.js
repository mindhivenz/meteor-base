import { compose, composeWithTracker } from 'react-komposer'
import { inject } from '@mindhive/di'


const Empty = () => null

/*
 asyncFunc: (appContext, pushProps, ownProps)

 Call pushProps with the props to push to the child component.
 You must call pushProps when asyncFunc is first called.
 */
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
 As per withAsync but calls to Meteor reactive calls inside asyncFunc are tracked,
 and asyncFunc rerun if the result of those Meteor calls changes.
 This rerun is not blocked by shouldResubscribe.

 Note: we don't use the loading and error component of react-komposer.
 Push that data through props to handle it nicely.
 */
export const withReactiveData = (asyncFunc, shouldResubscribe) =>
  composeWithTracker(
    inject((appContext, ownProps, onData) => {
      const pushProps = (props = {}) =>
        onData(null, props)
      asyncFunc(appContext, pushProps, ownProps)
    }),
    Empty,
    null,
    { shouldResubscribe },
  )
