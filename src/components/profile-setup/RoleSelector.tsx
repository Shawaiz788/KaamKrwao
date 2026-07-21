import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type Role = 'client' | 'provider';

interface RoleSelectorProps {
  role: Role;
  onSelectRole: (val: Role) => void;
}

export default function RoleSelector({ role, onSelectRole }: RoleSelectorProps) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>Register as</Text>
      <View style={styles.roleContainer}>
        {/* Client Card */}
        <Pressable
          style={[
            styles.roleCard,
            role === 'client' ? styles.roleCardActive : styles.roleCardInactive,
          ]}
          onPress={() => onSelectRole('client')}
        >
          <View style={styles.roleTextContainer}>
            <Text
              style={[
                styles.roleTitle,
                role === 'client' ? styles.roleTitleActive : styles.roleTitleInactive,
              ]}
            >
              Client
            </Text>
            <Text
              style={[
                styles.roleDesc,
                role === 'client' ? styles.roleDescActive : styles.roleDescInactive,
              ]}
            >
              I want to find trusted local services for my work.
            </Text>
          </View>
          <View
            style={[
              styles.radioCircle,
              role === 'client' ? styles.radioCircleActive : styles.radioCircleInactive,
            ]}
          >
            {role === 'client' && <View style={styles.radioDot} />}
          </View>
        </Pressable>

        {/* Service Provider Card */}
        <Pressable
          style={[
            styles.roleCard,
            role === 'provider' ? styles.roleCardActive : styles.roleCardInactive,
          ]}
          onPress={() => onSelectRole('provider')}
        >
          <View style={styles.roleTextContainer}>
            <Text
              style={[
                styles.roleTitle,
                role === 'provider' ? styles.roleTitleActive : styles.roleTitleInactive,
              ]}
            >
              Service Provider
            </Text>
            <Text
              style={[
                styles.roleDesc,
                role === 'provider' ? styles.roleDescActive : styles.roleDescInactive,
              ]}
            >
              I want to provide my services and get hired by clients.
            </Text>
          </View>
          <View
            style={[
              styles.radioCircle,
              role === 'provider' ? styles.radioCircleActive : styles.radioCircleInactive,
            ]}
          >
            {role === 'provider' && <View style={styles.radioDot} />}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  roleContainer: {
    gap: 16,
  },
  roleCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleCardActive: {
    borderColor: '#0B5A3E',
    backgroundColor: 'rgba(11, 90, 62, 0.04)',
  },
  roleCardInactive: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  roleTextContainer: {
    flex: 1,
    gap: 4,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  roleTitleActive: {
    color: '#0B5A3E',
  },
  roleTitleInactive: {
    color: '#374151',
  },
  roleDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  roleDescActive: {
    color: '#0B5A3E',
    opacity: 0.8,
  },
  roleDescInactive: {
    color: '#6B7280',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#0B5A3E',
  },
  radioCircleInactive: {
    borderColor: '#9CA3AF',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0B5A3E',
  },
});
