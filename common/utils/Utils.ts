class Utils {
  async wait(ms: number): Promise<void> {
    return new Promise(r => setTimeout(() => r(), ms))
  }
}

export default new Utils()
