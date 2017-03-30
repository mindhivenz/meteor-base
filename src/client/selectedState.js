import memoize from 'lru-memoize'


export const SELECT_NEW_ID = 'new'

// memoize so doesn't cause prop changes
export default memoize(10)(
  (paramId, newIndex) => {
    const isNew = paramId === SELECT_NEW_ID
    return {
      isNew,
      atIndex: Math.trunc(parseInt(newIndex, 10)) || 0,
      id: isNew ? null : paramId,
    }
  }
)
