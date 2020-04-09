/*
 * @Author: dxy
 * @Github: https://github.com/xiaomuzhu
 * @Email: meituandxy@gmail.com
 * @Date: 2020-04-09 13:38:35
 * @LastEditors: dxy
 * @LastEditTime: 2020-04-09 13:38:51
 * @FilePath: /situ/src/constants.ts
 */

import { Action } from './types'

export const TERMINATE_ACTION: Action<null> = {
  type: Symbol('terminate'),
  payload: null,
  state: null
} as any
