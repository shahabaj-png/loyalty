import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { IdentityService } from './identity.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

class SubmitDocumentDto {
  @IsString() documentType: string; // PASSPORT, DRIVERS_LICENSE, NATIONAL_ID
  @IsString() documentImage: string; // base64 encoded
  @IsOptional() @IsString() issuingCountry?: string;
}

class FaceDto {
  @IsString() faceImage: string; // base64 encoded
  @IsOptional() livenessData?: any;
}

@ApiTags('Identity')
@Controller('identity')
export class IdentityController {
  constructor(private identityService: IdentityService) {}

  @Post('verify-document')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit ID document for verification' })
  async submitDocument(@Request() req: any, @Body() dto: SubmitDocumentDto) {
    return this.identityService.submitDocument(req.user.id, dto);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Check identity verification status' })
  async getStatus(@Request() req: any) {
    return this.identityService.checkVerificationStatus(req.user.id);
  }

  @Post('face/enroll')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll face for recognition' })
  async enrollFace(@Request() req: any, @Body() dto: FaceDto) {
    return this.identityService.enrollFace(req.user.id, dto);
  }

  @Post('face/verify')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify face against enrollment' })
  async verifyFace(@Request() req: any, @Body() dto: FaceDto) {
    return this.identityService.verifyFace(req.user.id, dto);
  }

  @Delete('face')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove face enrollment' })
  async removeFace(@Request() req: any) {
    return this.identityService.removeFaceEnrollment(req.user.id);
  }

  @Post('webhook/onfido')
  @ApiOperation({ summary: 'Onfido verification webhook callback' })
  async onfidoWebhook(@Body() payload: any) {
    return this.identityService.handleVerificationWebhook(payload);
  }
}
