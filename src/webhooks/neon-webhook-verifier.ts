import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { createPublicKey, verify } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';

type NeonJwk = {
  kid: string;
  [key: string]: unknown;
};

@Injectable()
export class NeonWebhookVerifier {
  async verifyAndParse(
    rawBody: Buffer | undefined,
    headers: IncomingHttpHeaders,
  ): Promise<any> {
    if (!rawBody) {
      throw new UnauthorizedException('Raw request body is missing');
    }

    const signature = headers['x-neon-signature'];
    const kid = headers['x-neon-signature-kid'];
    const timestamp = headers['x-neon-timestamp'];

    if (
      typeof signature !== 'string' ||
      typeof kid !== 'string' ||
      typeof timestamp !== 'string'
    ) {
      throw new UnauthorizedException('Missing Neon signature headers');
    }

    const timestampMs = Number(timestamp);

    if (
      !Number.isFinite(timestampMs) ||
      Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000
    ) {
      throw new UnauthorizedException('Webhook timestamp expired');
    }

    const authBaseUrl = process.env.NEON_AUTH_BASE_URL;

    if (!authBaseUrl) {
      throw new InternalServerErrorException(
        'NEON_AUTH_BASE_URL is not configured',
      );
    }

    const response = await fetch(
      `${authBaseUrl.replace(/\/+$/, '')}/.well-known/jwks.json`,
    );

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Unable to retrieve Neon webhook public keys',
      );
    }

    const jwks = (await response.json()) as {
      keys?: NeonJwk[];
    };

    const jwk = jwks.keys?.find((key) => key.kid === kid);

    if (!jwk) {
      throw new UnauthorizedException('Unknown webhook signing key');
    }

    const [headerB64, emptyPayload, signatureB64] = signature.split('.');

    if (!headerB64 || emptyPayload !== '' || !signatureB64) {
      throw new UnauthorizedException('Invalid detached signature format');
    }

    const publicKey = createPublicKey({
      key: jwk as Parameters<typeof createPublicKey>[0] extends {
        key: infer K;
      }
        ? K
        : never,
      format: 'jwk',
    });

    // Neon signs the base64url-encoded raw body together with its timestamp.
    const bodyB64 = rawBody.toString('base64url');
    const signedPayload = `${timestamp}.${bodyB64}`;
    const signedPayloadB64 =
      Buffer.from(signedPayload, 'utf8').toString('base64url');
    const signingInput = `${headerB64}.${signedPayloadB64}`;

    const isValid = verify(
      null,
      Buffer.from(signingInput, 'utf8'),
      publicKey,
      Buffer.from(signatureB64, 'base64url'),
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    try {
      return JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new UnauthorizedException('Invalid webhook JSON');
    }
  }
}