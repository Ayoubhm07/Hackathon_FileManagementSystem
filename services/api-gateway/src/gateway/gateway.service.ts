import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async proxy(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    targetUrl: string,
    headers: Record<string, string | undefined>,
    body?: unknown,
  ): Promise<unknown> {
    const correlationId = headers['x-correlation-id'];
    this.logger.log(`Proxying ${method} ${targetUrl} [${correlationId}]`);

    const forwardHeaders: Record<string, string> = {
      'content-type': 'application/json',
      'x-correlation-id': correlationId ?? '',
      'x-user-id': headers['x-user-id'] ?? '',
      'x-user-role': headers['x-user-role'] ?? '',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.request({ method, url: targetUrl, headers: forwardHeaders, data: body }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data: unknown } };
        throw new HttpException(axiosError.response.data as string | Record<string, unknown>, axiosError.response.status);
      }
      throw error;
    }
  }

  async proxyForm(targetUrl: string, headers: Record<string, string | undefined>, form: FormData): Promise<unknown> {
    this.logger.log(`Proxying multipart POST ${targetUrl}`);
    try {
      const response = await firstValueFrom(
        this.httpService.post(targetUrl, form, {
          headers: {
            ...form.getHeaders(),
            'x-correlation-id': headers['x-correlation-id'] ?? '',
            'x-user-id': headers['x-user-id'] ?? '',
            'x-user-role': headers['x-user-role'] ?? '',
          },
        }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data: unknown } };
        throw new HttpException(axiosError.response.data as string | Record<string, unknown>, axiosError.response.status);
      }
      throw error;
    }
  }

  getServiceUrl(service: 'UPLOAD' | 'VALIDATION' | 'AUTH'): string {
    const map: Record<string, string> = {
      UPLOAD: this.configService.getOrThrow<string>('UPLOAD_SERVICE_URL'),
      VALIDATION: this.configService.getOrThrow<string>('VALIDATION_SERVICE_URL'),
      AUTH: this.configService.getOrThrow<string>('AUTH_SERVICE_URL'),
    };
    return map[service];
  }
}
