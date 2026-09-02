import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { AppModule } from "./app.module.js";

async function khoi_dong() {
  const jwt_secret = process.env.JWT_SECRET;
  const cookie_secret = process.env.COOKIE_SECRET;
  if (!jwt_secret || jwt_secret.length < 32) throw new Error("JWT_SECRET phải có ít nhất 32 ký tự");
  if (!cookie_secret || cookie_secret.length < 32) throw new Error("COOKIE_SECRET phải có ít nhất 32 ký tự");

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ trustProxy: true, bodyLimit: 3 * 1024 * 1024 }), { bufferLogs: true });
  const fastify = app.getHttpAdapter().getInstance();

  await fastify.register(cookie, { secret: cookie_secret });
  await fastify.register(cors, {
    origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map(x => x.trim()).filter(Boolean),
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"]
  });
  await fastify.register(helmet, { global: true, contentSecurityPolicy: false });
  const api_rate_limit_max = Math.max(120, Number(process.env.API_RATE_LIMIT_MAX || 600) || 600);
  await fastify.register(rateLimit, { max: api_rate_limit_max, timeWindow: "1 minute" });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableShutdownHooks();

  const cau_hinh_openapi = new DocumentBuilder().setTitle("NhienIn3d API").setDescription("API v3.17.0 cho cửa hàng sản phẩm in 3D NhienIn3d").setVersion("3.17.0").addCookieAuth("nhienin3d_phien").build();
  const tai_lieu = SwaggerModule.createDocument(app, cau_hinh_openapi);
  SwaggerModule.setup("tai-lieu", app, tai_lieu);

  const cong = Number(process.env.API_PORT || 3001);
  await app.listen(cong, "0.0.0.0");
  console.log(`✅ NhienIn3d API: http://localhost:${cong}/api/v1`);
  console.log(`📚 OpenAPI: http://localhost:${cong}/tai-lieu`);
}

void khoi_dong();
