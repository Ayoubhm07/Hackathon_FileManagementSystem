import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AirflowService {
  private readonly logger = new Logger(AirflowService.name);

  constructor(private readonly configService: ConfigService) {}

  async triggerPipeline(documentId: string, storagePath: string, correlationId?: string): Promise<void> {
    const airflowUrl = this.configService.getOrThrow<string>('AIRFLOW_BASE_URL');
    const username = this.configService.getOrThrow<string>('AIRFLOW_USERNAME');
    const password = this.configService.getOrThrow<string>('AIRFLOW_PASSWORD');
    const dagRunId = `docflow_${documentId}_${Date.now()}`;

    await axios.post(
      `${airflowUrl}/api/v1/dags/docflow_pipeline/dagRuns`,
      { dag_run_id: dagRunId, conf: { document_id: documentId, storage_path: storagePath, correlation_id: correlationId ?? documentId } },
      { auth: { username, password }, timeout: 10000 },
    );
    this.logger.log(`Airflow DAG triggered: ${dagRunId}`);
  }
}
