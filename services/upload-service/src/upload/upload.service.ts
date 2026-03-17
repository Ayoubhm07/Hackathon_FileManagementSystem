import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MinioService } from '../minio/minio.service';
import { AirflowService } from '../airflow/airflow.service';
import { DocumentsService } from '../documents/documents.service';
import { DocumentStatus } from '../documents/document.schema';

export interface UploadInput {
  filename: string;
  mimetype: string;
  buffer: Buffer;
  userId?: string;
  correlationId?: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly minioService: MinioService,
    private readonly airflowService: AirflowService,
    private readonly documentsService: DocumentsService,
  ) {}

  async handleUpload(input: UploadInput) {
    const documentId = uuidv4();
    const ext = input.filename.split('.').pop() ?? 'bin';
    const storagePath = `${documentId}/original.${ext}`;

    await this.minioService.uploadToRaw(storagePath, input.buffer, input.mimetype);

    const doc = await this.documentsService.create({
      filename: `${documentId}.${ext}`,
      originalName: input.filename,
      storagePath,
      mimeType: input.mimetype,
      fileSize: input.buffer.length,
      userId: input.userId,
    });
    const docId = String(doc._id);

    await this.documentsService.updateStatus(docId, DocumentStatus.PROCESSING, 'upload-service');

    this.airflowService
      .triggerPipeline(docId, storagePath, input.correlationId)
      .catch((err: unknown) =>
        this.logger.error(`Failed to trigger Airflow: ${err instanceof Error ? err.message : String(err)}`),
      );

    return { documentId: docId, filename: input.filename, storagePath, status: DocumentStatus.PROCESSING };
  }
}
