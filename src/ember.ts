import { Config, RootReducer, ReducerMap } from './globe'
import { buildStore } from './store'

export class Ember<T extends ReducerMap> {
  protected readonly config: Config<T>
  constructor(config: Config<T>) {
    this.config = config
  }

  public init() {
    const reducer = this.getReducer()
    const { middlewares } = this.config
    const store = buildStore(reducer, middlewares)
    return store
  }

  private getReducer() {
    const models = this.config.modules
    const extraReducer = this.config.reducers
    const reducer: RootReducer = {}
    Object.keys(models).forEach(item => {
      const model = models[item]
      reducer[item] = model.reducer
    })

    if (extraReducer) {
      return Object.assign(reducer, this.config.reducers) as RootReducer<T>
    }

    return reducer
  }
}
