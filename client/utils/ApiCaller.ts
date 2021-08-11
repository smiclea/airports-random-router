import axios, { AxiosRequestConfig } from 'axios'

export type RequestErrorTypes = 'ERROR_RESPONSE' | 'NO_RESPONSE' | 'CANCELED' | 'SETUP_ERROR'

export type RequestError = {
  type: RequestErrorTypes,
  error: any,
}

class ApiCaller {
  async send<T>(requestConfig: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios({
        url: requestConfig.url,
        method: requestConfig.method || 'GET',
        headers: requestConfig.headers || {},
        data: requestConfig.data || null,
        cancelToken: requestConfig.cancelToken,
      })
      return response.data
    } catch (err) {
      if (err.response) {
        throw { type: 'ERROR_RESPONSE', error: err }
      }
      if (err.request) {
        throw { type: 'NO_RESPONSE', error: err }
      }
      if (axios.isCancel(err)) {
        throw { type: 'CANCELED' }
      }
      throw { type: 'SETUP_ERROR' }
    }
  }
}

export default new ApiCaller()
