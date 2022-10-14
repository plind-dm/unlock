import { Request, Response } from 'express'
import Dispatcher from '../../fulfillment/dispatcher'
import { notifyNewKeyToWedlocks } from '../../operations/wedlocksOperations'
import Normalizer from '../../utils/normalizer'
import { Web3Service } from '@unlock-protocol/unlock-js'
import logger from '../../logger'
import { generateQrCode } from '../../utils/qrcode'
import { KeyMetadata } from '../../models/keyMetadata'
import { Lock } from '@unlock-protocol/types'
import satori from 'satori'
import { readFileSync } from 'fs'
import { Ticket } from '@unlock-protocol/ui'
const inter400 = readFileSync('fonts/inter-400.woff')
const inter700 = readFileSync('fonts/inter-700.woff')

export class TicketsController {
  public web3Service: Web3Service
  constructor({ web3Service }: { web3Service: Web3Service }) {
    this.web3Service = web3Service
  }

  /**
   * API to generate signatures that prove validity of a token
   * @param request
   * @param response
   * @returns
   */
  async sign(request: Request, response: Response) {
    const lockAddress = Normalizer.ethereumAddress(request.params.lockAddress)
    const network = Number(request.params.network)
    const tokenId = request.params.keyId

    const dispatcher = new Dispatcher()
    const [payload, signature] = await dispatcher.signToken(
      network,
      lockAddress,
      tokenId
    )
    response.status(200).send({ payload, signature })
  }
  /**
   * This will mark a ticket as check-in, this operation is only allowed for a lock verifier of a lock manager
   * @param {Request} request
   * @param {Response} response
   * @return
   */
  async markTicketAsCheckIn(request: Request, response: Response) {
    try {
      const lockAddress = Normalizer.ethereumAddress(request.params.lockAddress)
      const network = Number(request.params.network)
      const id = request.params.keyId.toLowerCase()

      const keyMetadata = await KeyMetadata.findOne({
        where: {
          id,
          address: lockAddress,
        },
      })

      const data = keyMetadata?.data as unknown as {
        metadata: { checkedInAt: number }
      }

      const isCheckedIn = data?.metadata?.checkedInAt

      if (isCheckedIn) {
        return response.status(409).send({
          error: 'Ticket already checked in',
        })
      }

      await KeyMetadata.upsert(
        {
          id,
          chain: network,
          address: lockAddress,
          data: {
            ...data,
            metadata: {
              ...data?.metadata,
              checkedInAt: new Date().getTime(),
            },
          },
        },
        {
          returning: true,
        }
      )
      return response.status(202).send({
        message: 'Ticket checked in',
      })
    } catch (error) {
      logger.error(error.message)
      return response.status(500).send({
        error: 'Could not mark ticket as checked in',
      })
    }
  }

  /**
   * API call to send an QR code by email. This can only be called by a lock manager
   * @param request
   * @param response
   * @returns
   */
  async sendEmail(request: Request, response: Response) {
    try {
      const lockAddress = Normalizer.ethereumAddress(request.params.lockAddress)
      const network = Number(request.params.network)
      const keyId = request.params.keyId.toLowerCase()

      const keyOwner = await this.web3Service.ownerOf(
        lockAddress,
        keyId,
        network
      )

      const lock: Lock = await this.web3Service.getLock(lockAddress, network)

      await notifyNewKeyToWedlocks(
        {
          keyId,
          lock: {
            address: lockAddress,
            name: lock.name,
          },
          owner: {
            address: keyOwner,
          },
        },
        network,
        true
      )
      return response.status(200).send({
        sent: true,
      })
    } catch (err) {
      logger.error(err.message)
      return response.sendStatus(500)
    }
  }

  /**
   * Function that serves a QR code.
   * It can only be called by a lock manager (otherwise anyone can create a valid QR code that will be used to check-in!)
   * @param request
   * @param response
   * @returns
   */
  async getQrCode(request: Request, response: Response) {
    try {
      const lockAddress = Normalizer.ethereumAddress(request.params.lockAddress)
      const network = Number(request.params.network)
      const tokenId = request.params.keyId.toLowerCase()

      const qrCode = (
        await generateQrCode({
          network,
          lockAddress,
          tokenId,
        })
      ).replace('data:image/gif;base64,', '')
      const img = Buffer.from(qrCode, 'base64')

      response.writeHead(200, {
        'Content-Type': 'image/gif',
      })
      return response.end(img)
    } catch (err) {
      logger.error(err)
      return response.sendStatus(500).send({
        message: 'Failed to generate QR code',
      })
    }
  }

  async ticket(request: Request, response: Response) {
    const lockAddress = Normalizer.ethereumAddress(request.params.lockAddress)
    const network = Number(request.params.network)
    const tokenId = request.params.keyId.toLowerCase()
    const lock = await this.web3Service.getLock(lockAddress, network)
    const userAddress = await this.web3Service.ownerOf(
      lockAddress,
      tokenId,
      network
    )
    const qrCode = await generateQrCode({
      network,
      lockAddress,
      tokenId,
    })
    const ticket = await satori(
      <Ticket
        iconURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAATVSURBVHgB7ZpNbBtFFMef8+Ekjt04NUoTaMCQSEWI0lyAQotUwQGk0guVoAoSVByAFnEAJFQ4cCUXjrTiggiHqhyKiigSuZRKBAgn0hYEBCwiGjVfdWvXjh1bdtz3H8WV19mvsWe9m4+ftIp3dnYz/31v3nsztu+Hb7Il8hAPzJ+hcOYvy35TfUcpuniO/IWEab9Ue5T+4b5lmshjJDoftNUvkpq0FAsC+TnNuecE3wgOUcbfa9qn2NROkfQk2aF5ZVlz3kIu08EWwBHIzVELD67AYnwW91SLMAMvpxLXBGOe9t28KMQ6SSKgnSKuCIbQvsRFagSz3Qc05w2fw8Hl6YaJnYk8R/mWsKat4RYOL1mnHFkQ6HIVwnKtYUqyK1fPX9BwwTIBxy7wmhLn23hoiNL814yGC9Z76/WCfIw0hQMuPBs+IMTr0fA5vNC11xHRZSD+vuvnqMugWmu4hWGBP+95k7p4LneupqQlLjSQpkLsmqroSU6IeVyNK2kJohfZ0our50hTKsUCPA/xotqbXC8tZdOUzHTQC5CuCw5lp233hWcsbNtru7+jaenS7+N06Y9xTdvA/btp32MHTe+rXvGMx2bop39nNG3927fR8KMPiUUFgl7PrQnL9Jblvs4KZrGjZ0Y0bc8+PWwpuBqIHRmb0LTtH9wpBCPVQMQ1Lhf749+bPmfewBNcd2m7cxIWK0fdRRZTXSNXgpLyhkEedn15iAU/XNQMvJTYjiOaNhQXABG+3CfOJSZcvrp+rsR1wSgFYa3ywPWAdfVEiIqKRWI+Zy02Dcq4Lhhg4Cj+70phF2NC6l4za+rhCcEAKx4cs92ovuREy+C5PS2n2RK80dl0gn31fPMw/MYjdz4vLSUpzUclwc4u6uRDBr3ngB099975fPqzy1QrdUXp+YX/Ta+nDQbvxP+yy6Zz6bosXOlaZ8+forPfntJc3/f4QXrrtY9JBr3nDD28n95/+ySpoC7BlfMqqDNX0VbZxw5Bgzkv+xwjttLSRmdL8EbHUcHY55JlUuceVQELKBOsN6g5LhZkRBv1H+TNQFUoE2y0WTf61QjZ5UuDvgNRDwpG/tzDBUI1sNhHIy8L6xmB8vPTzz+gsQun11zrZc/Re26t+FT+bCn23xV6/d2ndK9h4C8cOkaDbK3eVfeH0Ene3v2aKyujF4IKC9u9qvCp/p0WysKTbC0VHOYXdFyyNLVCU1oGW6co1Pq3+JxfiVAqv0v8lQGDxBJPZu7qAauqFguEYH9TnHaFPyF/c3xNh4XsM3Q1/SLJ8MqREyJqIwjNSS7rEAtefemEcH8nEC69e/uHumLLQDCEywKxP//6nVgBWQmH0MPPHxNCg5KbBjL4Lo9dKEVDX5h2SuT4O51SBwX9U9TG3pAvRih26zhlCjvJLghoEB2bvqJphycgkA0ozLVm+K7/+E7JzLpGJPJDFEs643ZO0lSL2PVMzRsAidweEdW7234T55lCP8WXnySvU5PgHM9heEY0NKppD/ELmE4dJS9TU2nZxmLvDpxf0x5p/0WI9jLKl4cdLVfJyygX3OzLkJdRLrhYCpCXUS44y9HayygXnCnar77cQKng+PITVFzZRC59LXOIvI4ywbAuFhVeR4lgVF7rwbqgbsEFTkNTyffWhXXBbSZWyg3FPUUlAAAAAElFTkSuQmCC"
        title={lock.name}
        id={tokenId}
        recipient={userAddress}
        lockAddress={lockAddress}
        network={network}
        // time="10:00 - 12:00"
        // date="10/10/2022 - 10/15/2022"
        // location="190 Bowery, Soho, New York"
        QRCodeURL={qrCode}
      />,
      {
        width: 450,
        height: 900,
        fonts: [
          {
            name: 'Inter',
            data: inter400,
            style: 'normal',
            weight: 400,
          },
          {
            name: 'Inter',
            data: inter700,
            style: 'normal',
            weight: 700,
          },
        ],
      }
    )

    return response.setHeader('content-type', 'image/svg+xml').send(ticket)
  }
}
