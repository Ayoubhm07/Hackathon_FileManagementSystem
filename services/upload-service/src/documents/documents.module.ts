import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocFlowDocument, DocumentSchema } from './document.schema';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: DocFlowDocument.name, schema: DocumentSchema }])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
