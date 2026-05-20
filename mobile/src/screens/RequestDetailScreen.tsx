// src/screens/RequestDetailScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const BLOOD_COLORS: Record<string, string> = {
  'A+': '#ef4444', 'A-': '#f97316', 'B+': '#8b5cf6',
  'B-': '#3b82f6', 'AB+': '#ec4899', 'AB-': '#06b6d4',
  'O+': '#22c55e', 'O-': '#f59e0b',
};

export default function RequestDetailScreen({ route, navigation }: any) {
  const { request } = route.params || {};
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Request not found.</Text>
      </SafeAreaView>
    );
  }

  const urgencyColor = request.urgency === 'critical' ? '#ef4444'
    : request.urgency === 'high' ? '#f97316' : '#22c55e';

  const handleAccept = async () => {
    Alert.alert('Confirm Donation', 'Are you sure you want to accept this blood request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        style: 'default',
        onPress: async () => {
          setAccepting(true);
          try {
            await api.post(`/requests/${request._id}/accept`);
            setAccepted(true);
            Alert.alert('✅ Accepted!', 'You have accepted the request. The requester will be notified.');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to accept request.');
          } finally {
            setAccepting(false);
          }
        },
      },
    ]);
  };

  const handleCall = () => {
    if (request.contactPhone) {
      Linking.openURL(`tel:${request.contactPhone}`);
    }
  };

  const bloodColor = BLOOD_COLORS[request.bloodGroup] || '#ef4444';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Blood Group Badge */}
        <View style={styles.bloodBadgeContainer}>
          <View style={[styles.bloodBadge, { backgroundColor: bloodColor + '22', borderColor: bloodColor }]}>
            <Text style={[styles.bloodGroup, { color: bloodColor }]}>{request.bloodGroup}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor + '22' }]}>
            <Text style={[styles.urgencyText, { color: urgencyColor }]}>
              {(request.urgency || 'normal').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.card}>
          <InfoRow label="Patient Name" value={request.patientName || 'Anonymous'} />
          <InfoRow label="Hospital" value={request.hospitalName || 'Not specified'} />
          <InfoRow label="Units Required" value={`${request.unitsRequired || 1} unit(s)`} />
          <InfoRow label="Units Fulfilled" value={`${request.unitsFulfilled || 0} unit(s)`} />
          <InfoRow label="Required By" value={request.requiredBy ? new Date(request.requiredBy).toLocaleDateString() : 'Urgent'} />
        </View>

        {request.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Notes</Text>
            <Text style={styles.notes}>{request.notes}</Text>
          </View>
        ) : null}

        {/* Location */}
        {request.location?.address && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>📍 Location</Text>
            <Text style={styles.value}>{request.location.address}</Text>
          </View>
        )}

        {/* Status */}
        <View style={styles.card}>
          <InfoRow label="Status" value={(request.status || 'open').toUpperCase()} />
          <InfoRow label="Posted" value={new Date(request.createdAt).toLocaleString()} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {request.contactPhone && (
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Text style={styles.callBtnText}>📞 Call Requester</Text>
            </TouchableOpacity>
          )}

          {!accepted && request.status === 'open' && (
            <TouchableOpacity
              style={[styles.acceptBtn, accepting && { opacity: 0.6 }]}
              onPress={handleAccept}
              disabled={accepting}
            >
              {accepting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.acceptBtnText}>🩸 Accept Request</Text>
              }
            </TouchableOpacity>
          )}

          {accepted && (
            <View style={styles.acceptedBadge}>
              <Text style={styles.acceptedText}>✅ You accepted this request</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 4 },
  backText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1, padding: 16 },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 40, fontSize: 16 },
  bloodBadgeContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, marginVertical: 24,
  },
  bloodBadge: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  bloodGroup: { fontSize: 32, fontWeight: '900' },
  urgencyBadge: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  urgencyText: { fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: '#111118', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 6,
  },
  cardLabel: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  value: { color: '#f8fafc', fontSize: 14, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  notes: { color: '#cbd5e1', fontSize: 14, lineHeight: 20, marginTop: 4 },
  actions: { gap: 12, marginTop: 8, marginBottom: 32 },
  callBtn: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  callBtnText: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  acceptBtn: {
    backgroundColor: '#ef4444', borderRadius: 14, padding: 18, alignItems: 'center',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  acceptBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  acceptedBadge: {
    backgroundColor: '#16a34a22', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#22c55e44',
  },
  acceptedText: { color: '#22c55e', fontSize: 15, fontWeight: '700' },
});
