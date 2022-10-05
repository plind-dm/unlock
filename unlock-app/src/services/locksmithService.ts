import { LocksmithService, Configuration } from '@unlock-protocol/unlock-js'
import axios from 'axios'
import createAuthRefreshInterceptor from 'axios-auth-refresh'
import { config } from '~/config/app'
import { APP_NAME } from '~/hooks/useAppStorage'

export const locksmithService = new LocksmithService(
  new Configuration(),
  config.locksmithHost,
  axios
)

createAuthRefreshInterceptor(
  axios,
  async (failedRequest) => {
    const refreshToken = localStorage.getItem(`${APP_NAME}.refresh-token`)
    const response = await locksmithService.refreshToken(refreshToken!)
    const { accessToken } = response.data
    failedRequest.response.config.headers[
      'Authorization'
    ] = `Bearer ${accessToken}`

    return failedRequest
  },
  {
    statusCodes: [403, 401],
  }
)
