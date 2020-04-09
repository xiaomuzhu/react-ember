/*
 * @Author: dxy
 * @Github: https://github.com/xiaomuzhu
 * @Email: meituandxy@gmail.com
 * @Date: 2020-04-09 13:39:49
 * @LastEditors: dxy
 * @LastEditTime: 2020-04-09 13:45:07
 * @FilePath: /situ/src/devtool.ts
 */
import { noop } from 'rxjs'
import { TERMINATE_ACTION } from './constants'
import { Action } from './types'

interface GlobalState {
  [modelName: string]: object
}

let devtool: { send: Function; init: Function } = {
  send: noop,
  init: noop
}

const FakeReduxDevTools = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connect: () => devtool
}

export const INIT_ACTION_TYPE = 'INIT_SITU_STATE'

const ReduxDevTools =
  (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) ??
  FakeReduxDevTools

const STATE: GlobalState = {}

const logStateAction = (action: Action<unknown>) => {
  if (action.type === TERMINATE_ACTION.type) {
    return
  }
  const namespace = (action as any).store.name
  const _action = {
    type: `${namespace}/${String(action.type)}`,
    params: filterParams(action.payload)
  }

  STATE[namespace] = (action as any).store.getState()

  if (!(action.type as string)?.endsWith?.(INIT_ACTION_TYPE)) {
    devtool.send(_action, STATE)
  }
}

export const initDevtool = () => {
  if (process.env.NODE_ENV === 'development') {
    devtool = ReduxDevTools.connect({
      name: `Situ`
    })
    devtool.init(STATE)
  }
}

function filterParams(params: any): any {
  if (params && typeof params === 'object' && typeof Event !== 'undefined') {
    if (params instanceof Event) {
      return `<<Event:${params.type}>>`
    } else if (params.nativeEvent instanceof Event) {
      return `<<SyntheticEvent:${params.nativeEvent.type}>>`
    }
  }

  return params
}
