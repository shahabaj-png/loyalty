import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { api } from '../services/api';

type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export default function IdentityScreen() {
  const [status, setStatus] = useState<VerificationStatus>('UNVERIFIED');
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await api.identity.getStatus();
      setStatus(res.documentStatus || 'UNVERIFIED');
      setFaceEnrolled(res.faceEnrolled || false);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async () => {
    Alert.alert(
      'Upload Document',
      'In production, this opens the camera or file picker to upload your government ID.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Upload',
          onPress: async () => {
            try {
              await api.identity.submitDocument({ type: 'DRIVERS_LICENSE', simulateSuccess: true });
              setStatus('PENDING');
              Alert.alert('Submitted!', 'Your document is being reviewed. This usually takes 1-2 minutes.');
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'Upload failed');
            }
          },
        },
      ]
    );
  };

  const handleFaceEnroll = async () => {
    Alert.alert(
      'Face Enrollment',
      'In production, this opens the front camera for liveness detection and face capture.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Enrollment',
          onPress: async () => {
            try {
              await api.identity.enrollFace({ simulateSuccess: true });
              setFaceEnrolled(true);
              Alert.alert('Enrolled!', 'Your face has been enrolled for quick verification.');
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'Enrollment failed');
            }
          },
        },
      ]
    );
  };

  const handleFaceVerify = async () => {
    Alert.alert(
      'Face Verification',
      'In production, this opens the camera to verify your identity.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Verify',
          onPress: async () => {
            try {
              const res = await api.identity.verifyFace({ simulateSuccess: true });
              Alert.alert(
                res.verified ? '✅ Verified!' : '❌ Not Verified',
                res.verified ? 'Your identity has been confirmed.' : 'Face did not match. Please try again.'
              );
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'Verification failed');
            }
          },
        },
      ]
    );
  };

  const handleRemoveFace = async () => {
    Alert.alert('Remove Face Data', 'Are you sure? You can re-enroll anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.identity.removeFace();
            setFaceEnrolled(false);
            Alert.alert('Removed', 'Your face data has been deleted.');
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Could not remove face data');
          }
        },
      },
    ]);
  };

  const statusConfig: Record<VerificationStatus, { color: string; icon: string; label: string; desc: string }> = {
    UNVERIFIED: { color: '#6B7280', icon: '🔓', label: 'Not Verified', desc: 'Upload a document to get verified and unlock full features.' },
    PENDING: { color: '#F59E0B', icon: '⏳', label: 'Pending Review', desc: 'Your document is being reviewed. This usually takes 1-2 minutes.' },
    VERIFIED: { color: '#10B981', icon: '✅', label: 'Verified', desc: 'Your identity has been verified. You have full access.' },
    REJECTED: { color: '#EF4444', icon: '❌', label: 'Rejected', desc: 'Your document was rejected. Please try again with a valid ID.' },
  };

  const sc = statusConfig[status];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Status Card */}
      <View style={[styles.statusCard, { borderLeftColor: sc.color }]}>
        <Text style={styles.statusIcon}>{sc.icon}</Text>
        <View>
          <Text style={[styles.statusLabel, { color: sc.color }]}>{sc.label}</Text>
          <Text style={styles.statusDesc}>{sc.desc}</Text>
        </View>
      </View>

      {/* Document Verification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📄 Document Verification</Text>
        <Text style={styles.sectionDesc}>
          Upload a government-issued ID (driver's license, passport, or national ID) to verify your identity.
        </Text>
        {(status === 'UNVERIFIED' || status === 'REJECTED') && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleDocumentUpload}>
            <Text style={styles.actionBtnText}>Upload Document</Text>
          </TouchableOpacity>
        )}
        {status === 'PENDING' && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={loadStatus}>
            <Text style={[styles.actionBtnText, { color: '#6366F1' }]}>Refresh Status</Text>
          </TouchableOpacity>
        )}
        {status === 'VERIFIED' && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✅ Document verified</Text>
          </View>
        )}
      </View>

      {/* Face Verification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Face Verification</Text>
        <Text style={styles.sectionDesc}>
          Enroll your face for quick, contactless identity verification. Uses liveness detection to prevent fraud.
        </Text>

        {!faceEnrolled ? (
          <TouchableOpacity style={styles.actionBtn} onPress={handleFaceEnroll}>
            <Text style={styles.actionBtnText}>Enroll Face</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✅ Face enrolled</Text>
            </View>
            <View style={styles.faceActions}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, marginRight: 8 }]} onPress={handleFaceVerify}>
                <Text style={styles.actionBtnText}>Verify Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger, { flex: 1 }]} onPress={handleRemoveFace}>
                <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Privacy Info */}
      <View style={styles.privacyCard}>
        <Text style={styles.privacyTitle}>🔒 Your Privacy</Text>
        <Text style={styles.privacyText}>
          Your identity data is encrypted and stored securely. Face vectors are encrypted at rest and never shared with third parties. You can delete your biometric data at any time.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  statusCard: {
    backgroundColor: '#FFF', margin: 16, borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, elevation: 2,
  },
  statusIcon: { fontSize: 36, marginRight: 16 },
  statusLabel: { fontSize: 18, fontWeight: '700' },
  statusDesc: { fontSize: 13, color: '#6B7280', marginTop: 4, maxWidth: '85%' },
  section: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  sectionDesc: { fontSize: 14, color: '#6B7280', marginTop: 8, lineHeight: 20 },
  actionBtn: {
    backgroundColor: '#6366F1', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16,
  },
  actionBtnSecondary: { backgroundColor: '#EEF2FF' },
  actionBtnDanger: { backgroundColor: '#FEE2E2' },
  actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  verifiedBadge: { backgroundColor: '#ECFDF5', padding: 12, borderRadius: 8, marginTop: 12 },
  verifiedText: { color: '#10B981', fontWeight: '600', textAlign: 'center' },
  faceActions: { flexDirection: 'row', marginTop: 12 },
  privacyCard: { margin: 16, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  privacyTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  privacyText: { fontSize: 13, color: '#6B7280', marginTop: 8, lineHeight: 20 },
});
