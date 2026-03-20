import {
  Controller, Post, Get, Patch, Param, Body,
  Headers, Query, UseGuards, HttpCode, HttpStatus, Req,
  InternalServerErrorException,
} from '@nestjs/common';

import { JwtGuard } from '../auth/jwt.guard';
import { GatewayService } from './gateway.service';
import * as FormData from 'form-data';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post('upload')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  async upload(@Headers() headers: Record<string, string>, @Req() req: any): Promise<unknown> {
    if (!req.isMultipart()) throw new InternalServerErrorException('Expected multipart');
    const data = await req.file();
    if (!data) throw new InternalServerErrorException('No file in request');

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);

    const form = new FormData();
    form.append('file', buffer, { filename: data.filename, contentType: data.mimetype });

    const targetUrl = `${this.gatewayService.getServiceUrl('UPLOAD')}/upload`;
    return this.gatewayService.proxyForm(targetUrl, headers, form);
  }

  @Get('documents')
  @UseGuards(JwtGuard)
  async listDocuments(
    @Headers() headers: Record<string, string>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ): Promise<unknown> {
    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    if (status) params.set('status', status);
    return this.gatewayService.proxy('GET', `${this.gatewayService.getServiceUrl('UPLOAD')}/documents?${params}`, headers);
  }

  @Get('documents/:id')
  @UseGuards(JwtGuard)
  async getDocument(@Headers() headers: Record<string, string>, @Param('id') id: string): Promise<unknown> {
    return this.gatewayService.proxy('GET', `${this.gatewayService.getServiceUrl('UPLOAD')}/documents/${id}`, headers);
  }

  @Patch('documents/:id/status')
  @UseGuards(JwtGuard)
  async updateDocumentStatus(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.gatewayService.proxy('PATCH', `${this.gatewayService.getServiceUrl('UPLOAD')}/documents/${id}/status`, headers, body);
  }

  @Get('results/:id')
  @UseGuards(JwtGuard)
  async getResult(@Headers() headers: Record<string, string>, @Param('id') id: string): Promise<unknown> {
    return this.gatewayService.proxy('GET', `${this.gatewayService.getServiceUrl('VALIDATION')}/validate/${id}`, headers);
  }

  @Get('entities/:id')
  @UseGuards(JwtGuard)
  async getEntities(@Headers() headers: Record<string, string>, @Param('id') id: string): Promise<unknown> {
    return this.gatewayService.proxy('GET', `${this.gatewayService.getServiceUrl('EXTRACTION')}/entities/${id}`, headers);
  }

  @Post('auth/users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Headers() headers: Record<string, string>, @Body() body: unknown): Promise<unknown> {
    return this.gatewayService.proxy('POST', `${this.gatewayService.getServiceUrl('AUTH')}/auth/users`, headers, body);
  }

  @Post('auth/users/:id/roles')
  @UseGuards(JwtGuard)
  async assignRole(@Headers() headers: Record<string, string>, @Param('id') id: string, @Body() body: unknown): Promise<unknown> {
    return this.gatewayService.proxy('POST', `${this.gatewayService.getServiceUrl('AUTH')}/auth/users/${id}/roles`, headers, body);
  }

  @Get('auth/users/:id')
  @UseGuards(JwtGuard)
  async getUser(@Headers() headers: Record<string, string>, @Param('id') id: string): Promise<unknown> {
    return this.gatewayService.proxy('GET', `${this.gatewayService.getServiceUrl('AUTH')}/auth/users/${id}`, headers);
  }

  // ── Human validation decision (triggers Kafka → notification) ─────────────

  @Post('decisions/:documentId')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async humanDecide(
    @Headers() headers: Record<string, string>,
    @Param('documentId') documentId: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.gatewayService.proxy(
      'POST',
      `${this.gatewayService.getServiceUrl('VALIDATION')}/validate/${documentId}`,
      headers,
      body,
    );
  }

  // ── Notification endpoints ─────────────────────────────────────────────────

  @Get('notifications')
  @UseGuards(JwtGuard)
  async getNotifications(
    @Headers() headers: Record<string, string>,
    @Query('userId') userId?: string,
  ): Promise<unknown> {
    const params = userId ? `?userId=${userId}` : '';
    return this.gatewayService.proxy(
      'GET',
      `${this.gatewayService.getServiceUrl('NOTIFICATION')}/notifications${params}`,
      headers,
    );
  }

  @Patch('notifications/read-all')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(
    @Headers() headers: Record<string, string>,
    @Query('userId') userId?: string,
  ): Promise<unknown> {
    const params = userId ? `?userId=${userId}` : '';
    return this.gatewayService.proxy(
      'PATCH',
      `${this.gatewayService.getServiceUrl('NOTIFICATION')}/notifications/read-all${params}`,
      headers,
    );
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @Headers() headers: Record<string, string>,
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ): Promise<unknown> {
    const params = userId ? `?userId=${userId}` : '';
    return this.gatewayService.proxy(
      'PATCH',
      `${this.gatewayService.getServiceUrl('NOTIFICATION')}/notifications/${id}/read${params}`,
      headers,
    );
  }
}
