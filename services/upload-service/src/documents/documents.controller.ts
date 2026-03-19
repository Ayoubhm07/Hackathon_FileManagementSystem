import { Controller, Get, Param, Query, Patch, Body, Logger } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentStatus, DocumentType } from './document.schema';

@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: DocumentStatus) {
    return this.documentsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: DocumentStatus; documentType?: DocumentType }) {
    return this.documentsService.updateStatus(id, body.status, 'pipeline', body.documentType);
  }
}
