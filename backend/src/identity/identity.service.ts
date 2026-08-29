import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

// NOTE: In production, replace these with actual SDK integrations:
// - Onfido/Jumio for document verification
// - AWS Rekognition / Azure Face API for facial recognition
// - TensorFlow Lite / ML Kit for on-device liveness

@Injectable()
export class IdentityService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  // ============ DOCUMENT VERIFICATION ============
  async submitDocument(userId: string, dto: { documentType: string; documentImage: string; issuingCountry?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.identityStatus === 'VERIFIED') throw new BadRequestException('Identity already verified');

    // Create document record
    const doc = await this.prisma.identityDocument.create({
      data: {
        userId,
        documentType: dto.documentType,
        issuingCountry: dto.issuingCountry,
        status: 'PENDING',
        // In production: upload image to S3, store URL
        fileUrl: `s3://loyalty-docs/${userId}/${Date.now()}.encrypted`,
      },
    });

    // In production: Call Onfido/Jumio SDK
    // const verification = await onfido.createCheck({ applicantId, documentId });
    // For now, simulate async verification
    const ocrResult = await this.simulateOCR(dto.documentImage);

    // Update document with OCR data
    await this.prisma.identityDocument.update({
      where: { id: doc.id },
      data: { ocrData: ocrResult, verificationId: `verify_${doc.id}` },
    });

    return {
      documentId: doc.id,
      status: 'PENDING',
      message: 'Document submitted for verification. This typically takes 1-5 minutes.',
      estimatedTime: '1-5 minutes',
    };
  }

  async checkVerificationStatus(userId: string) {
    const latestDoc = await this.prisma.identityDocument.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestDoc) return { status: 'NO_DOCUMENT', message: 'No identity document submitted' };

    return {
      status: latestDoc.status,
      documentType: latestDoc.documentType,
      submittedAt: latestDoc.createdAt,
      verifiedAt: latestDoc.verifiedAt,
    };
  }

  // Webhook handler for Onfido/Jumio callbacks
  async handleVerificationWebhook(payload: { verificationId: string; status: string; details?: any }) {
    const doc = await this.prisma.identityDocument.findFirst({
      where: { verificationId: payload.verificationId },
    });
    if (!doc) return;

    const newStatus = payload.status === 'approved' ? 'VERIFIED' : 'FAILED';
    await this.prisma.identityDocument.update({
      where: { id: doc.id },
      data: { status: newStatus as any, verifiedAt: newStatus === 'VERIFIED' ? new Date() : undefined },
    });

    await this.prisma.user.update({
      where: { id: doc.userId },
      data: { identityStatus: newStatus as any },
    });

    // Notify user
    await this.prisma.notification.create({
      data: {
        userId: doc.userId,
        title: newStatus === 'VERIFIED' ? '✅ Identity Verified!' : '❌ Verification Failed',
        body: newStatus === 'VERIFIED'
          ? 'Your identity has been verified successfully.'
          : 'Your identity verification was unsuccessful. Please try again.',
        type: 'IDENTITY_STATUS',
        data: { status: newStatus },
      },
    });
  }

  // ============ FACIAL RECOGNITION ============
  async enrollFace(userId: string, dto: { faceImage: string; livenessData?: any }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.faceEnrolled) throw new BadRequestException('Face already enrolled');

    // Step 1: Liveness detection (on-device in mobile, server-side fallback)
    const livenessScore = await this.checkLiveness(dto.faceImage, dto.livenessData);
    if (livenessScore < 0.90) {
      throw new BadRequestException('Liveness check failed. Please ensure good lighting and look directly at the camera.');
    }

    // Step 2: Extract face vector
    // In production: AWS Rekognition IndexFaces or Azure Face API
    // const faceVector = await rekognition.indexFaces({ CollectionId: 'loyalty-faces', Image: { Bytes: imageBuffer } });
    const faceVector = Buffer.from('simulated-face-vector'); // Placeholder

    // Step 3: Store encrypted face data
    await this.prisma.user.update({
      where: { id: userId },
      data: { faceEnrolled: true, faceVector },
    });

    return { enrolled: true, message: 'Face enrolled successfully. You can now use facial recognition for login.' };
  }

  async verifyFace(userId: string, dto: { faceImage: string; livenessData?: any }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.faceEnrolled) throw new BadRequestException('Face not enrolled');

    // Liveness check
    const livenessScore = await this.checkLiveness(dto.faceImage, dto.livenessData);
    if (livenessScore < 0.90) {
      throw new BadRequestException('Liveness check failed');
    }

    // In production: AWS Rekognition SearchFacesByImage
    // const result = await rekognition.searchFacesByImage({ CollectionId, Image, FaceMatchThreshold: 85 });
    const matchScore = 0.95; // Simulated match
    const isMatch = matchScore >= 0.85;

    // Rate limit face verification attempts
    const rateLimitKey = `face_verify:${userId}`;
    const allowed = await this.redis.checkRateLimit(rateLimitKey, 5, 300); // 5 attempts per 5 min
    if (!allowed) throw new BadRequestException('Too many verification attempts. Please wait.');

    return { verified: isMatch, confidence: matchScore, message: isMatch ? 'Face verified successfully' : 'Face does not match' };
  }

  async removeFaceEnrollment(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { faceEnrolled: false, faceVector: null },
    });
    // In production: Delete from Rekognition collection
    return { message: 'Face enrollment removed' };
  }

  // ============ PRIVATE HELPERS ============
  private async checkLiveness(faceImage: string, livenessData?: any): Promise<number> {
    // In production: Use TensorFlow Lite model or AWS Rekognition DetectFaces
    // Checks: eye blink detection, head movement, texture analysis, depth estimation
    // For now, return a simulated score
    return 0.95;
  }

  private async simulateOCR(documentImage: string): Promise<any> {
    // In production: Use Google Vision API or Tesseract.js
    return {
      extractedName: 'Pending Extraction',
      documentNumber: 'Pending',
      expiryDate: 'Pending',
      confidence: 0.0,
    };
  }
}
