import { compose, composeWithTracker } from 'react-komposer'
import shallowEqual from 'shallowequal'
import { app } from '@mindhive/di'

import { withDisplayName, loadingProps, errorProps } from './containers'


const composeFunc = (asyncFunc) =>
  (ownProps, onData) => {
    let pushPropsCalled = false
    const pushProps = (props = {}) => {
      pushPropsCalled = true
      onData(null, props)
    }
    asyncFunc(app(), pushProps, ownProps)
    if (! pushPropsCalled) {
      pushProps()
    }
  }

/*
 asyncFunc: (app, pushProps, ownProps)

 Call pushProps with the props to push to the child component.

 Note: we don't use the loading and error component of react-komposer.
 Push that data through props to handle it nicely.
 */
export const withAsync = (asyncFunc, shouldResubscribe) =>
  withDisplayName('withAsync',
    compose(
      composeFunc(asyncFunc),
      null,
      null,
      { shouldResubscribe },
    )
  )

/*
 As per withAsync but calls to Meteor reactive calls inside asyncFunc are tracked,
 and asyncFunc rerun if the result of those Meteor calls changes.
 This rerun is not blocked by shouldResubscribe.
 */
export const withMeteorReactive = (asyncFunc, shouldResubscribe) =>
  withDisplayName('withMeteorReactive',
    composeWithTracker(
      composeFunc(asyncFunc),
      null,
      null,
      { shouldResubscribe },
    )
  )

export const withApiCallResult = ({
  propName,
  methodName,
  propsToArgs = () => null,
  overrideCallProps = () => null,
  resultToProps = (result) => ({ [propName]: result }),
}) =>
  withDisplayName(`apiCall(${methodName})`,
    withAsync(
      async (appContext, pushProps, props) => {
        const overrideProps = overrideCallProps(props)
        if (overrideProps) {
          pushProps(overrideProps)
          return
        }
        pushProps(loadingProps())
        try {
          pushProps(resultToProps(
            await app().api.call(methodName, propsToArgs(props), { notifyViewerPending: false })
          ))
        } catch (e) {
          pushProps(errorProps(e, props))
        }
      },
      (currentProps, nextProps) =>
      ! shallowEqual(overrideCallProps(currentProps), overrideCallProps(nextProps)) ||
      (! overrideCallProps(nextProps) && ! shallowEqual(propsToArgs(currentProps), propsToArgs(nextProps)))
    )
  )

export const connectSubscription = ({
  publicationName,
  dataToProps,
  propsToArgs = () => null,
  overrideCallProps = () => null,
}) =>
  withDisplayName(`connect(${publicationName})`,
    withMeteorReactive(
      ({ Meteor }, pushProps, props) => {
        const overrideProps = overrideCallProps(props)
        if (overrideProps) {
          pushProps(overrideProps)
          return
        }
        const callbacks = {
          onStop(error) {
            if (error) {
              pushProps(errorProps(error, props))
            }
          },
        }
        if (Meteor.subscribe(publicationName, propsToArgs(props), callbacks).ready()) {
          pushProps(dataToProps(app(), props))
        } else {
          pushProps(loadingProps())
        }
      },
      (currentProps, nextProps) =>
      ! shallowEqual(overrideCallProps(currentProps), overrideCallProps(nextProps)) ||
      (! overrideCallProps(nextProps) && ! shallowEqual(propsToArgs(currentProps), propsToArgs(nextProps)))
    )
  )
