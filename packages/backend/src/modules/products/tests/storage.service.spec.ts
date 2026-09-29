import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../storage.service';

const mockBucketExists = jest.fn();
const mockMakeBucket = jest.fn();
const mockMinioPutObject = jest.fn();
const mockMinioRemoveObject = jest.fn();

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    bucketExists: mockBucketExists,
    makeBucket: mockMakeBucket,
    putObject: mockMinioPutObject,
    removeObject: mockMinioRemoveObject,
  })),
}));

const mockS3Send = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    originalname: 'plano.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image'),
    size: 10,
    ...overrides,
  } as Express.Multer.File;
}

async function buildService(storageConfig: Record<string, unknown>): Promise<StorageService> {
  const mockConfig = { get: (key: string) => storageConfig[key.replace('storage.', '')] };
  const module: TestingModule = await Test.createTestingModule({
    providers: [StorageService, { provide: ConfigService, useValue: mockConfig }],
  }).compile();

  const service = module.get<StorageService>(StorageService);
  await service.onModuleInit();
  return service;
}

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBucketExists.mockResolvedValue(true);
  });

  it('usa MinIO por defecto (sin config de S3)', async () => {
    const service = await buildService({
      endpoint: 'localhost',
      port: 9000,
      bucket: 'obraya-dev',
    });

    const url = await service.uploadProductImage('company-1', 'product-1', makeFile());

    expect(mockMinioPutObject).toHaveBeenCalledWith(
      'obraya-dev',
      expect.stringContaining('companies/company-1/products/product-1/'),
      expect.any(Buffer),
      10,
      { 'Content-Type': 'image/jpeg' },
    );
    expect(url).toMatch(/^http:\/\/localhost:9000\/obraya-dev\/companies\/company-1\/products\/product-1\/.+\.jpg$/);
    expect(mockS3Send).not.toHaveBeenCalled();
  });

  it('usa S3 real cuando estan configurados AWS_S3_BUCKET/AWS_S3_REGION', async () => {
    const service = await buildService({
      s3Bucket: 'obraya-prod',
      s3Region: 'sa-east-1',
    });

    const url = await service.uploadProductImage('company-1', 'product-1', makeFile());

    expect(mockS3Send).toHaveBeenCalledTimes(1);
    expect(url).toBe(
      url.match(/^https:\/\/obraya-prod\.s3\.sa-east-1\.amazonaws\.com\/companies\/company-1\/products\/product-1\/.+\.jpg$/)?.[0],
    );
    expect(mockMinioPutObject).not.toHaveBeenCalled();
  });

  it('usa el dominio de CloudFront como URL si esta configurado', async () => {
    const service = await buildService({
      s3Bucket: 'obraya-prod',
      s3Region: 'sa-east-1',
      cloudfrontDomain: 'cdn.obraya.com',
    });

    const url = await service.uploadTechnicalSheet('company-1', 'product-1', makeFile());

    expect(url).toMatch(/^https:\/\/cdn\.obraya\.com\/companies\/company-1\/products\/product-1\/ficha-tecnica-.+\.pdf$/);
  });

  it('deleteObject usa S3 cuando esta en modo S3', async () => {
    const service = await buildService({ s3Bucket: 'obraya-prod', s3Region: 'sa-east-1' });

    await service.deleteObject('companies/company-1/products/product-1/foo.jpg');

    expect(mockS3Send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: { Bucket: 'obraya-prod', Key: 'companies/company-1/products/product-1/foo.jpg' },
      }),
    );
    expect(mockMinioRemoveObject).not.toHaveBeenCalled();
  });

  it('deleteObject usa MinIO cuando esta en modo MinIO', async () => {
    const service = await buildService({ bucket: 'obraya-dev', endpoint: 'localhost', port: 9000 });

    await service.deleteObject('companies/company-1/products/product-1/foo.jpg');

    expect(mockMinioRemoveObject).toHaveBeenCalledWith('obraya-dev', 'companies/company-1/products/product-1/foo.jpg');
  });

  it('no lanza si falla la conexion a MinIO al iniciar (best-effort)', async () => {
    mockBucketExists.mockRejectedValue(new Error('connection refused'));

    await expect(buildService({ bucket: 'obraya-dev' })).resolves.toBeInstanceOf(StorageService);
  });
});
