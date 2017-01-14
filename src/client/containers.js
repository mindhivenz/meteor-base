import React from 'react'


export const withDisplayName = (name, containerComponentOrCreator) => {
  if (containerComponentOrCreator.constructor) {
    containerComponentOrCreator.displayName = name
    return containerComponentOrCreator
  }
  return (...args) => {
    const ContainerComponent = containerComponentOrCreator(...args)
    ContainerComponent.displayName = name
    return ContainerComponent
  }
}

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
  withDisplayName('errorContainer',
    withAsyncContainerComponentsContext(
      (
        { errors, ...props },
        { asyncContainerComponents: { Error } },
      ) =>
        errors ? React.createElement(Error, { errors })
        : React.createElement(Component, props)
    )
  )

export const asyncContainer = Component =>
  withDisplayName('asyncContainer',
    withAsyncContainerComponentsContext(
      (
        { errors, loading, ...props },
        { asyncContainerComponents: { Error, Loading } },
      ) =>
        errors ? React.createElement(Error, { errors })
        : (loading ? React.createElement(Loading) : React.createElement(Component, props))
    )
  )
