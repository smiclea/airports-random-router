class ObjectUtils {
  hasOwnProperty<X extends {}, Y extends PropertyKey>(
    obj: X,
    prop: Y,
  ): obj is X & Record<Y, unknown> {
    return obj.hasOwnProperty(prop)
  }
}

export default new ObjectUtils()
