class CustomError extends Error {
  data: any | undefined

  constructor(message: string, data?: any) {
    super(message)

    if (data) {
      this.data = data
    }
  }
}

export default CustomError
