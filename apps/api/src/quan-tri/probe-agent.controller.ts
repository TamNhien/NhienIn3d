import { Body, Controller, Headers, Post, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { ApiTags } from "@nestjs/swagger";
import { ProbeAgentHeartbeatDto, ProbeAgentIngestDto } from "./dto/probe-agent.dto.js";
import { QuanTriService } from "./quan-tri.service.js";

@ApiTags("Probe Agent")
@Controller("probe-agent")
export class ProbeAgentController {
  constructor(private readonly service: QuanTriService) {}

  @Post("heartbeat")
  heartbeat(
    @Req() request: FastifyRequest,
    @Headers("x-nhienin3d-agent") agent: string | undefined,
    @Headers("x-nhienin3d-timestamp") timestamp: string | undefined,
    @Headers("x-nhienin3d-nonce") nonce: string | undefined,
    @Headers("x-nhienin3d-signature") signature: string | undefined,
    @Headers("x-nhienin3d-signature-alg") algorithm: string | undefined,
    @Body() dto: ProbeAgentHeartbeatDto,
  ) {
    const signedBody = request.body as Record<string, unknown>;
    return this.service.probe_agent_heartbeat_v3110({ agent, timestamp, nonce, signature, algorithm }, dto, signedBody);
  }

  @Post("ingest")
  ingest(
    @Req() request: FastifyRequest,
    @Headers("x-nhienin3d-agent") agent: string | undefined,
    @Headers("x-nhienin3d-timestamp") timestamp: string | undefined,
    @Headers("x-nhienin3d-nonce") nonce: string | undefined,
    @Headers("x-nhienin3d-signature") signature: string | undefined,
    @Headers("x-nhienin3d-signature-alg") algorithm: string | undefined,
    @Body() dto: ProbeAgentIngestDto,
  ) {
    const signedBody = request.body as Record<string, unknown>;
    return this.service.probe_agent_ingest_v3110({ agent, timestamp, nonce, signature, algorithm }, dto, signedBody);
  }
}
