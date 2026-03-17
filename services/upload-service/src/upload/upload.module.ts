import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { MinioService } from '../minio/minio.service';
import { AirflowService } from '../airflow/airflow.service';

@Module({
  imports: [DocumentsModule],
  controllers: [UploadController],
  providers: [UploadService, MinioService, AirflowService],
})
export class UploadModule {}
