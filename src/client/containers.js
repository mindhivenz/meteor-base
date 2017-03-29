import React from 'react'
import compose from 'recompose/compose'
import setDisplayName from 'recompose/setDisplayName'


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
    asyncContainerComponents: React.PropTypes.object.isRequired,
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

const withAsyncContainerComponentsContext = (Component) => {
  Component.contextTypes = {
    asyncContainerComponents: React.PropTypes.object.isRequired,
  }
  return Component
}

export const errorContainer = Component =>
  compose(
    setDisplayName('errorContainer'),
    withAsyncContainerComponentsContext(
      (
        { errors, ...props },
        { asyncContainerComponents: { Error } },
      ) =>
        errors ? React.createElement(Error, { errors })
          : React.createElement(Component, props)
    ),
  )

export const asyncContainer = Component =>
  compose(
    setDisplayName('asyncContainer'),
    withAsyncContainerComponentsContext(
      (
        { errors, loading, ...props },
        { asyncContainerComponents: { Error, Loading } },
      ) =>
        errors ? React.createElement(Error, { errors })
        : (loading ? React.createElement(Loading) : React.createElement(Component, props))
    ),
  )
