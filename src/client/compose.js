import { compose, composeWithTracker } from 'react-komposer'
import shallowEqual from 'recompose/shallowEqual'
import setDisplayName from 'recompose/setDisplayName'
import { app } from '@mindhive/di'

import { loadingProps, errorProps } from './containers'


const composeFunc = asyncFunc =>
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
  setDisplayName('withAsync')(
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
  setDisplayName('withMeteorReactive')(
    composeWithTracker(
      composeFunc(asyncFunc),
      null,
      null,
      { shouldResubscribe },
    )
  )

export const withApiCallResult = ({
  methodName,
  mapPropsToArgs = props => null,      // eslint-disable-line no-unused-vars
  skipCall = props => false,        // eslint-disable-line no-unused-vars
  overrideCallProps = props => skipCall(props) ? {} : null,  // null -> do not override
  propName,
  resultToProps = result => ({ [propName]: result }),
}) =>
  setDisplayName(`apiCall(${methodName})`)(
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
            await app().api.call(methodName, mapPropsToArgs(props), { notifyViewerPending: false })
          ))
        } catch (e) {
          pushProps(errorProps(e, props))
        }
      },
      (currentProps, nextProps) =>
        ! shallowEqual(overrideCallProps(currentProps), overrideCallProps(nextProps)) ||
        (! overrideCallProps(nextProps) && ! shallowEqual(mapPropsToArgs(currentProps), mapPropsToArgs(nextProps)))
    )
  )

export const connectSubscription = ({
  publicationName,
  dataToProps,
  mapPropsToArgs = props => null,                 // eslint-disable-line no-unused-vars
  skipSubscription = props => false,           // eslint-disable-line no-unused-vars
  overrideCallProps = props => skipSubscription(props) ? {} : null,   // null -> do not override
}) =>
  setDisplayName(`connect(${publicationName})`)(
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
        const args = mapPropsToArgs(props)
        if (Meteor.subscribe(publicationName, args, callbacks).ready()) {
          pushProps(dataToProps(app(), args))
        } else {
          pushProps(loadingProps())
        }
      },
      (currentProps, nextProps) =>
        ! shallowEqual(overrideCallProps(currentProps), overrideCallProps(nextProps)) ||
        (! overrideCallProps(nextProps) && ! shallowEqual(mapPropsToArgs(currentProps), mapPropsToArgs(nextProps)))
    )
  )
