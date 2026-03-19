import { Controller, Post, BadRequestException, Logger, Headers, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { UploadService } from './upload.service';

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'];

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @Req() req: any,
    @Headers('x-user-id') userId?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    if (!req.isMultipart()) throw new BadRequestException('Request must be multipart/form-data');

    const data = await req.file();
    if (!data) throw new BadRequestException('No file provided');

    if (!ALLOWED_TYPES.includes(data.mimetype)) {
      throw new BadRequestException(`Unsupported type: ${data.mimetype}. Allowed: PDF, PNG, JPEG, TIFF`);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);

    if (buffer.length > 10 * 1024 * 1024) throw new BadRequestException('File exceeds 10MB limit');

    this.logger.log(`Upload: ${data.filename} (${buffer.length} bytes) [${correlationId}]`);
    return this.uploadService.handleUpload({ filename: data.filename, mimetype: data.mimetype, buffer, userId, correlationId });
  }
}
