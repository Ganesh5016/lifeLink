// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, updateUser } = useAuthStore();
  const [toggling, setToggling] = useState(false);

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const { data } = await api.put('/donors/availability');
      updateUser({ isAvailable: data.isAvailable });
    } catch { Alert.alert('Error', 'Failed to update availability'); }
    setToggling(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const menuItems = [
    { icon: '💉', label: 'Donation History', onPress: () => navigation.navigate('DonationHistory') },
    { icon: '🏆', label: 'Leaderboard', onPress: () => navigation.navigate('Leaderboard') },
    { icon: '🔔', label: 'Notifications', onPress: () => navigation.navigate('Notifications') },
    { icon: '📄', label: 'Download Certificate', onPress: () => Alert.alert('Coming Soon', 'Certificate generation in development') },
    { icon: '📱', label: 'Share App', onPress: () => {} },
    { icon: '❓', label: 'Help & Support', onPress: () => {} },
    { icon: '🔒', label: 'Privacy Policy', onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <Text style={styles.headerTitle}>My Profile</Text>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <LinearGradient colors={['rgba(220,38,38,0.2)', 'transparent']} style={styles.heroSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.heroRow}>
            {user?.bloodGroup && (
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodBadgeText}>{user.bloodGroup}</Text>
              </View>
            )}
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        {user?.role === 'donor' && (
          <View style={styles.statsRow}>
            {[
              { label: 'Donations', value: user.totalDonations || 0 },
              { label: 'Points', value: user.rewardPoints || 0 },
              { label: 'Badges', value: user.badges?.length || 0 },
            ].map((s, i) => (
              <View key={s.label} style={[styles.statItem, i > 0 && styles.statBorder]}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Availability toggle (donors) */}
        {user?.role === 'donor' && (
          <View style={styles.availCard}>
            <View>
              <Text style={styles.availTitle}>Available to Donate</Text>
              <Text style={styles.availSubtitle}>
                {user?.isAvailable ? 'You can receive emergency requests' : 'You won\'t receive requests'}
              </Text>
            </View>
            {toggling
              ? <ActivityIndicator color="#22c55e" />
              : <Switch
                  value={user?.isAvailable || false}
                  onValueChange={toggleAvailability}
                  trackColor={{ false: '#374151', true: '#15803d' }}
                  thumbColor={user?.isAvailable ? '#22c55e' : '#64748b'}
                />
            }
          </View>
        )}

        {/* Badges */}
        {user?.badges && user.badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏅 Badges</Text>
            <View style={styles.badgesRow}>
              {user.badges.map((b: any) => (
                <View key={b.name} style={styles.badge}>
                  <Text style={styles.badgeIcon}>{b.icon}</Text>
                  <Text style={styles.badgeLabel}>{b.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                style={[styles.menuItem, i < menuItems.length - 1 && styles.menuBorder]}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  headerTitle: { color: '#f1f5f9', fontSize: 22, fontWeight: '800', padding: 16 },
  heroSection: { alignItems: 'center', paddingVertical: 28, paddingBottom: 32, marginBottom: 0 },
  avatar: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(220,38,38,0.2)', borderWidth: 3, borderColor: 'rgba(220,38,38,0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#ef4444', fontSize: 32, fontWeight: '800' },
  userName: { color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  userEmail: { color: '#64748b', fontSize: 14, marginBottom: 12 },
  heroRow: { flexDirection: 'row', gap: 10 },
  bloodBadge: { backgroundColor: 'rgba(220,38,38,0.2)', borderRadius: 10, borderWidth: 2, borderColor: 'rgba(220,38,38,0.5)', paddingHorizontal: 16, paddingVertical: 6 },
  bloodBadgeText: { color: '#ef4444', fontWeight: '800', fontSize: 16 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6 },
  roleText: { color: '#94a3b8', fontWeight: '600', fontSize: 12, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, margin: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.08)' },
  statValue: { color: '#ef4444', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { color: '#64748b', fontSize: 12 },
  availCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, marginHorizontal: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 8 },
  availTitle: { color: '#f1f5f9', fontWeight: '600', fontSize: 15, marginBottom: 3 },
  availSubtitle: { color: '#64748b', fontSize: 12 },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  badgeIcon: { fontSize: 16 },
  badgeLabel: { color: '#a78bfa', fontWeight: '600', fontSize: 13 },
  menuCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  menuIcon: { fontSize: 20, width: 30 },
  menuLabel: { flex: 1, color: '#f1f5f9', fontSize: 15 },
  menuArrow: { color: '#4b5563', fontSize: 20 },
  logoutBtn: { margin: 16, marginTop: 20, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});
