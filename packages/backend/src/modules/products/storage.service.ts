import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: MinioClient;
  private bucket: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.bucket = this.config.get<string>('storage.bucket') ?? 'obraya-dev';
    this.client = new MinioClient({
      endPoint: this.config.get<string>('storage.endpoint') ?? 'localhost',
      port: this.config.get<number>('storage.port') ?? 9000,
      useSSL: this.config.get<boolean>('storage.useSsl') ?? false,
      accessKey: this.config.get<string>('storage.accessKey') ?? 'minioadmin',
      secretKey: this.config.get<string>('storage.secretKey') ?? 'minioadmin',
    });

    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
        this.logger.log(`Bucket '${this.bucket}' creado`);
      }
    } catch (err) {
      this.logger.warn(`No se pudo conectar a MinIO: ${err.message}. Storage deshabilitado en dev.`);
    }
  }

  async uploadProductImage(
    companyId: string,
    productId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const objectName = `companies/${companyId}/products/${productId}/${uuidv4()}.${ext}`;

    await this.client.putObject(
      this.bucket,
      objectName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    // URL pública (MinIO dev) o URL de CloudFront (prod)
    const endpoint = this.config.get('storage.endpoint');
    const port = this.config.get('storage.port');
    return `http://${endpoint}:${port}/${this.bucket}/${objectName}`;
  }

  async uploadTechnicalSheet(
    companyId: string,
    productId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const objectName = `companies/${companyId}/products/${productId}/ficha-tecnica-${uuidv4()}.pdf`;

    await this.client.putObject(
      this.bucket,
      objectName,
      file.buffer,
      file.size,
      { 'Content-Type': 'application/pdf' },
    );

    const endpoint = this.config.get('storage.endpoint');
    const port = this.config.get('storage.port');
    return `http://${endpoint}:${port}/${this.bucket}/${objectName}`;
  }

  async deleteObject(objectName: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, objectName);
    } catch (err) {
      this.logger.error(`Error eliminando objeto: ${err.message}`);
    }
  }
}
