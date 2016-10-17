import React from 'react'


export const withDisplayName = (name, ContainerComponent, ChildComponent) => {
  const childName = ChildComponent && (ChildComponent.displayName || ChildComponent.name)
  ContainerComponent.displayName = childName ? `${name}(${childName})` : name
  return ContainerComponent
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

export const errorContainer = (Component) =>
  withDisplayName(
    'errorContainer',
    withAsyncContainerComponentsContext(
      (
        { errors, ...props },
        { asyncContainerComponents: { Error } },
      ) =>
        errors ?
          <Error errors={errors} />
        :
          <Component {...props} />
    ),
    Component,
  )

export const asyncContainer = (Component) =>
  withDisplayName(
    'asyncContainer',
    withAsyncContainerComponentsContext(
      (
        { errors, loading, ...props },
        { asyncContainerComponents: { Error, Loading } },
      ) =>
        errors ?
          <Error errors={errors} />
        :
          loading ?
            <Loading />
          :
            <Component {...props} />
    ),
    Component,
  )
