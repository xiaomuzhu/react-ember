import { MiddlewareAPI, Dispatch, AnyAction } from 'redux'

export let dispatch: Dispatch<AnyAction>
let getState: any

export function createMiddleware() {
  return (middlewareAPI: MiddlewareAPI) => {
    dispatch = middlewareAPI.dispatch
    getState = middlewareAPI.getState

    return (next: Dispatch<AnyAction>) => (action: any) => {
      let result = next(action)
      return result
    }
  }
}
