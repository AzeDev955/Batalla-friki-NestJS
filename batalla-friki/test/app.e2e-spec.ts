import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  const randomEmail = `test${Date.now()}@e2e.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // 1. PROBAR REGISTRO
  it('/users (POST) -> Register', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        email: randomEmail,
        password: 'password123',
        name: 'E2E Tester',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toEqual(randomEmail);
        expect(res.body.id).toBeDefined();
      });
  });

  it('/auth/login (POST) -> Login & Get Token', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: randomEmail,
        password: 'password123',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        jwtToken = res.body.access_token;
      });
  });

  it('/characters (GET) -> Get Characters with Token', () => {
    return request(app.getHttpServer())
      .get('/characters')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
