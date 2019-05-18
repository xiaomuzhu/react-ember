import {
  createStore as _createStore,
  applyMiddleware,
  combineReducers,
  compose,
  Middleware,
  Store,
  AnyAction,
  StoreEnhancer
} from 'redux'
import { createMiddleware } from './middleware'
import { RootReducer, RootState } from './globe'

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: typeof compose
  }
}

export function buildStore(models: RootReducer, middlewares: Middleware[] = []) {
  const middleware = applyMiddleware(...middlewares, createMiddleware())

  const enhancers = [middleware]

  let composeEnhancers = compose

  if (process.env.NODE_ENV !== 'production') {
    if (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
      composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    }
  }

  const reducer = createReducer(models)
  const enhancer: StoreEnhancer<Store<RootState, AnyAction>, {}> = composeEnhancers(...enhancers)
  const store = _createStore(reducer, enhancer)

  return store
}

export function replaceReducer(store: Store<any, AnyAction>, models: RootReducer) {
  const reducer = createReducer(models)
  store.replaceReducer(reducer)
}

function createReducer(models: RootReducer) {
  return combineReducers({
    ...models
  })
}
