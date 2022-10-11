import {
  LocksmithService as Service,
  LocksmithServiceConfiguration,
  WalletService,
} from '@unlock-protocol/unlock-js'
import { APP_NAME } from '~/hooks/useAppStorage'
import fetch from 'cross-fetch'
import { isExpired } from 'react-jwt'
import { config } from '~/config/app'
import { generateNonce } from 'siwe'

export class LocksmithService extends Service {
  #accessToken: string | null = null

  get accessToken() {
    const token = this.#accessToken
    if (!token) {
      return null
    }
    return isExpired(token) ? null : token
  }

  set accessToken(token: string | null) {
    this.#accessToken = token
  }

  get authToken() {
    return localStorage.getItem(`${APP_NAME}.refresh-token`)
  }

  set authToken(token: string | null) {
    if (!token) {
      return
    }
    localStorage.setItem(`${APP_NAME}.refresh-token`, token)
  }

  constructor(host: string) {
    super(
      new LocksmithServiceConfiguration({
        basePath: host,
        fetchApi: async (input, init) => {
          const authToken = this.authToken
          const accessToken = this.accessToken
          const response = await fetch(input, {
            ...init,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              ...init?.headers,
            },
          })
          if ([401, 403].includes(response.status)) {
            const { accessToken: newAccessToken } = await this.refreshToken({
              refreshToken: authToken,
            })
            this.accessToken = newAccessToken
            return fetch(input, {
              ...init,
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
                ...init?.headers,
              },
            })
          }
          return response
        },
      })
    )
  }

  async authenticate({
    address,
    walletService,
  }: {
    address: string
    walletService: WalletService
  }) {
    const siweMessage = Service.createSiweMessage({
      domain: 'locksmith.unlock-protocol.com',
      uri: config.locksmithHost,
      address,
      chainId: 1,
      version: '1',
      statement: '',
      nonce: generateNonce(),
    })
    const message = siweMessage.prepareMessage()
    const signature = await walletService.signMessage(message, 'personal_sign')
    const authResponse = await this.login({
      loginRequest: {
        message,
        signature,
      },
    })
    this.authToken = authResponse.refreshToken
    this.accessToken = authResponse.accessToken
  }
}

export const locksmithService = new LocksmithService(config.locksmithHost)
