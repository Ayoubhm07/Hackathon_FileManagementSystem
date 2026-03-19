import { Controller, Post, Get, Body, Param, Headers, Logger } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { ValidateDocumentDto, ValidateBatchDto } from './dto/validate.dto';

@Controller()
export class ValidationController {
  private readonly logger = new Logger(ValidationController.name);

  constructor(private readonly validationService: ValidationService) {}

  @Post('validate')
  async validate(
    @Body() dto: ValidateDocumentDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.validationService.validate(dto.documentId, correlationId);
  }

  @Post('validate/batch')
  async validateBatch(
    @Body() dto: ValidateBatchDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.validationService.validateBatch(dto.documentIds, correlationId);
  }

  @Get('validate/:documentId')
  async getResult(@Param('documentId') documentId: string) {
    return this.validationService.getResult(documentId);
  }
}
