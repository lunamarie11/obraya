import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Ver ADR-015: en produccion (AWS) usa S3 real; en dev sigue usando MinIO
// (mismo contrato, mismo docker-compose de siempre). El modo se elige solo
// en base a config, sin flags manuales: si AWS_S3_BUCKET/AWS_S3_REGION
// estan seteados, usa S3 — si no, cae a MinIO. Mismo patron best-effort que
// EmailService/NotificationsService/AfipService.
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private mode: 's3' | 'minio' = 'minio';

  private minioClient: MinioClient;
  private minioBucket: string;

  private s3Client: S3Client;
  private s3Bucket: string;
  private s3Region: string;
  private cloudfrontDomain?: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const s3Bucket = this.config.get<string>('storage.s3Bucket');
    const s3Region = this.config.get<string>('storage.s3Region');

    if (s3Bucket && s3Region) {
      this.mode = 's3';
      this.s3Bucket = s3Bucket;
      this.s3Region = s3Region;
      this.cloudfrontDomain = this.config.get<string>('storage.cloudfrontDomain') ?? undefined;
      // Sin `credentials` explicitas: usa el provider chain default del SDK
      // (variables de entorno o, en ECS Fargate, el IAM role de la task).
      this.s3Client = new S3Client({ region: s3Region });
      this.logger.log(`Storage en modo S3 (bucket '${s3Bucket}', region '${s3Region}')`);
      return;
    }

    this.mode = 'minio';
    this.minioBucket = this.config.get<string>('storage.bucket') ?? 'obraya-dev';
    this.minioClient = new MinioClient({
      endPoint: this.config.get<string>('storage.endpoint') ?? 'localhost',
      port: this.config.get<number>('storage.port') ?? 9000,
      useSSL: this.config.get<boolean>('storage.useSsl') ?? false,
      accessKey: this.config.get<string>('storage.accessKey') ?? 'minioadmin',
      secretKey: this.config.get<string>('storage.secretKey') ?? 'minioadmin',
    });

    await this.ensureMinioBucketExists();
  }

  private async ensureMinioBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.minioBucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.minioBucket, 'us-east-1');
        this.logger.log(`Bucket '${this.minioBucket}' creado`);
      }
    } catch (err) {
      this.logger.warn(`No se pudo conectar a MinIO: ${err.message}. Storage deshabilitado en dev.`);
    }
  }

  private async putObject(objectName: string, buffer: Buffer, size: number, contentType: string): Promise<string> {
    if (this.mode === 's3') {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: objectName,
          Body: buffer,
          ContentLength: size,
          ContentType: contentType,
        }),
      );
      return this.cloudfrontDomain
        ? `https://${this.cloudfrontDomain}/${objectName}`
        : `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${objectName}`;
    }

    await this.minioClient.putObject(this.minioBucket, objectName, buffer, size, { 'Content-Type': contentType });
    const endpoint = this.config.get('storage.endpoint');
    const port = this.config.get('storage.port');
    return `http://${endpoint}:${port}/${this.minioBucket}/${objectName}`;
  }

  async uploadProductImage(
    companyId: string,
    productId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const objectName = `companies/${companyId}/products/${productId}/${uuidv4()}.${ext}`;
    return this.putObject(objectName, file.buffer, file.size, file.mimetype);
  }

  async uploadTechnicalSheet(
    companyId: string,
    productId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const objectName = `companies/${companyId}/products/${productId}/ficha-tecnica-${uuidv4()}.pdf`;
    return this.putObject(objectName, file.buffer, file.size, 'application/pdf');
  }

  async deleteObject(objectName: string): Promise<void> {
    try {
      if (this.mode === 's3') {
        await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.s3Bucket, Key: objectName }));
      } else {
        await this.minioClient.removeObject(this.minioBucket, objectName);
      }
    } catch (err) {
      this.logger.error(`Error eliminando objeto: ${err.message}`);
    }
  }
}
