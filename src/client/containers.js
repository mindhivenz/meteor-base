import React from 'react'
import PropTypes from 'prop-types'
import compose from 'recompose/compose'
import setDisplayName from 'recompose/setDisplayName'
import getContext from 'recompose/getContext'


export const loadingProps = () => ({
  loading: true,
})

export const errorProps = (error, props) => {
  console.error(error, error.stack)  // eslint-disable-line no-console
  return {
    errors: [
      ...(props.errors || []),
      error,
    ],
  }
}

export class AsyncContainerComponentsProvider extends React.Component {

  static childContextTypes = {
    asyncContainerComponents: PropTypes.object.isRequired,
  }

  getChildContext = () => ({
    asyncContainerComponents: {
      Loading: this.props.Loading,
      Error: this.props.Error,
    },
  })

  render = () =>
    this.props.children
}

const withAsyncContainerComponents = getContext({
  asyncContainerComponents: PropTypes.object.isRequired,
})

export const errorContainer = Component =>
  compose(
    setDisplayName('errorContainer'),
    withAsyncContainerComponents,
  )(
    ({
      errors,
      asyncContainerComponents: { Error },
      ...props
    }) =>
      errors ? React.createElement(Error, { errors })
        : React.createElement(Component, props)
  )

export const asyncContainer = Component =>
  compose(
    setDisplayName('asyncContainer'),
    withAsyncContainerComponents,
  )(
    ({
        errors,
        loading,
        asyncContainerComponents: { Error, Loading },
        ...props,
      }) =>
      errors ? React.createElement(Error, { errors })
        : (loading ? React.createElement(Loading) : React.createElement(Component, props))
  )
