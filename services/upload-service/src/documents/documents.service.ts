import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocFlowDocument, DocumentDoc, DocumentStatus, DocumentType } from './document.schema';

export interface CreateDocumentDto {
  filename: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  userId?: string;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectModel(DocFlowDocument.name)
    private readonly documentModel: Model<DocumentDoc>,
  ) {}

  async create(dto: CreateDocumentDto): Promise<DocumentDoc> {
    const doc = new this.documentModel({
      ...dto,
      status: DocumentStatus.UPLOADED,
      statusHistory: [{ status: DocumentStatus.UPLOADED, timestamp: new Date(), service: 'upload-service' }],
    });
    const saved = await doc.save();
    this.logger.log(`Document created: ${String(saved._id)}`);
    return saved;
  }

  async findAll(query: { page?: number; limit?: number; status?: DocumentStatus }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (query.status) filter['status'] = query.status;

    const [data, total] = await Promise.all([
      this.documentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.documentModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<DocumentDoc> {
    const doc = await this.documentModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }

  async updateStatus(id: string, status: DocumentStatus, service: string, documentType?: DocumentType): Promise<DocumentDoc> {
    const update: Record<string, unknown> = {
      status,
      $push: { statusHistory: { status, timestamp: new Date(), service } },
    };
    if (documentType) update['documentType'] = documentType;
    const doc = await this.documentModel.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }
}
