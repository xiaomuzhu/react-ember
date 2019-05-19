import { MiddlewareAPI, Dispatch, AnyAction } from 'redux'

export let dispatch: Dispatch<AnyAction>

export function createMiddleware() {
  return (middlewareAPI: MiddlewareAPI) => {
    dispatch = middlewareAPI.dispatch

    return (next: Dispatch<AnyAction>) => (action: any) => {
      let result = next(action)
      return result
    }
  }
}
