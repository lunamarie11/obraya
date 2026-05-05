import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { InputSanitizerService } from './../src/common/input-sanitizer.service';
import { SecureValidationPipe } from './../src/common/secure-validation.pipe';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const sanitizer = app.get(InputSanitizerService);
    app.useGlobalPipes(new SecureValidationPipe(sanitizer));
    await app.init();
  });

  it('/auth/login (POST) should return 400 for invalid email format', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'Pass123' })
      .expect(400);
  });

  it('/auth/register (POST) should return 400 for malicious name input', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: '<script>alert(1)</script>',
        email: 'test@example.com',
        password: 'Pass123',
        role: 'ADMIN',
      })
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
