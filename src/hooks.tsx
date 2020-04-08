/*
 * @Author: dxy
 * @Github: https://github.com/xiaomuzhu
 * @Email: meituandxy@gmail.com
 * @Date: 2020-04-08 15:06:30
 * @LastEditors: dxy
 * @LastEditTime: 2020-04-08 18:04:58
 * @FilePath: /demo-ts/src/core/hooks.tsx
 */
import * as React from "react"
import { rootInjector, Provider, Injector } from "@asuka/di"

import { RootModel } from "./model"
import {
  Store,
  ConstructorOf,
  StateSelector,
  ActionFromRootModel,
} from "./types"
import { skip, map, distinctUntilChanged } from "rxjs/operators"
import { Subject } from "rxjs"
import { Draft } from "immer"

const {
  useContext,
  useMemo,
  useEffect,
  createContext,
  memo,
} = React

const _useDispatchers = <M extends RootModel<S>, S = any>(model: M) => {
  return useMemo(() => {
    const store: Store<S> = model.store!
    const actionsCreator = model.getActions()

    return Object.keys(actionsCreator).reduce((acc, cur) => {
      acc[cur] = (payload: any) => {
        const action = (actionsCreator as any)[cur](payload)
        store.dispatch(action)
      }
      return acc
    }, Object.create(null))
  }, [model])
}

const _useModel = <M extends RootModel<S>, S = any>(
  A: ConstructorOf<M>
): { model: M; store: Store<S> } => {
  const model = useInstance(A)
  const store = useMemo(() => {
    return model.createStore()
  }, [A])

  return { model, store }
}

function _useModelState<S, U = S>(store: Store<S>): S | U {
  const [appState, setState] = React.useState(() => {
    const initialState = store.getState()
    return initialState
  })

  const subscription = useMemo(() => {
    return store.state$
      .pipe(skip(1), distinctUntilChanged())
      .subscribe(setState)
  }, [store])

  useEffect(() => () => subscription.unsubscribe(), [store, subscription])

  return appState
}

export function useModule<M extends RootModel<any>, U>(
  A: ConstructorOf<M>
): M extends RootModel<infer State>
  ? [State, ActionFromRootModel<M, State>]
  : never

export function useModule<M extends RootModel<any>>(
  A: ConstructorOf<M>
): M extends RootModel<infer State>
  ? [State, ActionFromRootModel<M, State>]
  : never

export function useModule<M extends RootModel<any>, U>(
  A: ConstructorOf<M>,
  config: M extends RootModel<infer State>
    ? {
      selector: StateSelector<State, U>
      mutateStateOnFirstRendering?: (s: Draft<State>) => void
    }
    : never
): M extends RootModel<infer State>
  ? typeof config["selector"] extends StateSelector<State, infer NewState>
  ? [NewState, ActionFromRootModel<M, State>]
  : never
  : never

export function useModule<M extends RootModel<S>, U, S>(A: ConstructorOf<M>) {
  const { model, store } = _useModel(A)
  const appState = _useModelState(store)
  const appDispatcher = _useDispatchers(model)

  return [appState, appDispatcher]
}

const _InjectableContext = createContext<Injector>(rootInjector)

function InjectableContext({ children }: { children: React.ReactNode }) {
  return (
    <_InjectableContext.Provider value={rootInjector}>
      {children}
    </_InjectableContext.Provider>
  )
}

const ProvidersContext = createContext<Provider[]>([])

const InjectionProvidersContext = memo<{
  providers?: Provider[]
  children: React.ReactNode
}>(({ providers = [], children }) => {
  const parentInjector = useContext(_InjectableContext)
  const childInjectableFactory = useMemo(
    () => parentInjector.createChild(providers),
    [parentInjector, providers]
  )
  return (
    <_InjectableContext.Provider value={childInjectableFactory}>
      <ProvidersContext.Provider value={providers}>
        {children}
      </ProvidersContext.Provider>
    </_InjectableContext.Provider>
  )
})

function useInstance<T>(provider: Provider<T>): T {
  const childInjector = useContext(_InjectableContext)

  return childInjector.getInstance(provider)
}
