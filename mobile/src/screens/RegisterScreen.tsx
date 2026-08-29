import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useStore } from '../store';

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', referralCode: '' });
  const { register, isLoading } = useStore();

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) return Alert.alert('Error', 'Please fill in required fields');
    if (form.password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    try { await register(form); } catch (error: any) { Alert.alert('Registration Failed', error.response?.data?.message || 'Please try again'); }
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Join the Club</Text>
      <Text style={styles.subtitle}>Start earning rewards today</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.halfInput]} placeholder="First Name *" value={form.firstName} onChangeText={(v) => update('firstName', v)} />
        <TextInput style={[styles.input, styles.halfInput]} placeholder="Last Name *" value={form.lastName} onChangeText={(v) => update('lastName', v)} />
      </View>
      <TextInput style={styles.input} placeholder="Email *" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password * (min 8 chars)" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />
      <TextInput style={styles.input} placeholder="Phone (optional)" value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Referral Code (optional)" value={form.referralCode} onChangeText={(v) => update('referralCode', v)} autoCapitalize="characters" />
      <TouchableOpacity style={[styles.button, isLoading && { opacity: 0.6 }]} onPress={handleRegister} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Creating Account...' : 'Create Account'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 32 },
  row: { flexDirection: 'row', gap: 12 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 12, color: '#1F2937' },
  halfInput: { flex: 1 },
  button: { backgroundColor: '#6366F1', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
