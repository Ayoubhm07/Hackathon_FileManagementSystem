import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsModule } from './documents/documents.module';
import { UploadModule } from './upload/upload.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/docflow',
      }),
    }),
    HealthModule,
    DocumentsModule,
    UploadModule,
  ],
})
export class AppModule {}
