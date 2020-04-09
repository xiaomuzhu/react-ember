/*
 * @Author: dxy
 * @Github: https://github.com/xiaomuzhu
 * @Email: meituandxy@gmail.com
 * @Date: 2020-04-07 14:16:37
 * @LastEditors: dxy
 * @LastEditTime: 2020-04-09 13:39:28
 * @FilePath: /situ/src/store.ts
 */

import { Observable, Subject, noop, ReplaySubject, Subscription, identity } from 'rxjs'
import { Reducer } from 'react'
import { Action, Epic, StoreCreator, Store, StoreAction, StoreCreatorReturnType } from './types'
import { StoreSymbol } from './symbols'
import { TERMINATE_ACTION } from './constants'

export const createStore = <S>(
  reducer: Reducer<S, Action<unknown>>,
  effect: Epic<unknown>
): StoreCreatorReturnType<S> => {
  const action$ = new Subject<Action<unknown>>()
  const effect$ = new Subject<Action<unknown>>()
  const actionObservers = new Set<(action: Action<unknown>) => void>()
  const state$ = new ReplaySubject<S>(1)

  const create: StoreCreator<S> = defaultState => {
    const store: Store<S> = Object.create(null)
    let appState = defaultState

    const dispatch = <T>(action: StoreAction<T>) => {
      if (
        action.store &&
        action.store !== store &&
        action.type &&
        action.type !== TERMINATE_ACTION.type
      ) {
        action.store.dispatch(action)
        return
      }
      const prevState: S = appState
      const newState = reducer(prevState, action)
      if (newState !== prevState) {
        state$.next(newState)
      }

      action$.next(action)
      effect$.next(action)
    }

    const effectAction$: Observable<Action<unknown>> = effect(effect$)

    const subscription = new Subscription()

    subscription.add(
      effectAction$.subscribe(
        action => {
          try {
            dispatch(action as StoreAction)
          } catch (e) {
            action$.error(e)
          }
        },
        err => {
          console.error(err)
        }
      )
    )

    subscription.add(
      action$.subscribe(
        action => {
          for (const observer of actionObservers) {
            observer(action)
          }
        },
        (err: any) => {
          effect$.error(err)
        },
        () => {
          effect$.complete()
        }
      )
    )

    subscription.add(
      state$.subscribe(state => {
        appState = state
      })
    )

    state$.next(defaultState)

    Object.assign(store, {
      [StoreSymbol]: store,
      dispatch,
      state$,
      getState: () => appState,
      subscribeAction: (observer: (action: Action<unknown>) => void) => {
        actionObservers.add(observer)
        return () => actionObservers.delete(observer)
      },
      unsubscribe: () => {
        action$.complete()
        state$.complete()
        subscription.unsubscribe()
        store.dispatch = noop
        actionObservers.clear()
      }
    })
    return store
  }
  return { create, action$, state$ }
}
