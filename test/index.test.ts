import { init } from '../src/index'
import { BaseAction, reducer, effect } from '../src/action'
import { ActionHandlerMapFromModel } from '../src/globe'
import { getModel } from '../src/model'

const initState = {
  count: 0
}

type InitState = typeof initState

class Test extends BaseAction<InitState> {
  @reducer()
  public increment(state: InitState, payload: number): InitState {
    return {
      ...state,
      count: state.count + payload
    }
  }

  @effect()
  public async incrementAsync(payload: number) {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, 1000)
    })
    TestModel.action.increment(payload)
  }
}

type TestType = ActionHandlerMapFromModel<Test>
const TestModel = getModel<InitState, TestType>(Test, initState, 'test')
const rootModel = {
  test: TestModel
}

describe('init', () => {
  test('get Root State', () => {
    const store = init({
      modules: rootModel
    })

    expect(store.getState()).toEqual({
      test: {
        count: 0
      }
    })
  })

  test('reducer should be working', () => {
    const store = init({
      modules: rootModel
    })

    rootModel.test.action.increment(1)

    expect(store.getState()).toEqual({
      test: {
        count: 1
      }
    })
  })

  test('effect should be working', async () => {
    const store = init({
      modules: rootModel
    })

    await rootModel.test.effect.incrementAsync(2)

    setTimeout(() => {
      expect(store.getState()).toEqual({
        test: {
          count: 2
        }
      })
    })
  })
})
