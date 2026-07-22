import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export type Role = 'client' | 'provider' | 'admin';

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
              Client (Customer)
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
              Service Provider (Worker)
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

        {/* Admin Card */}
        <Pressable
          style={[
            styles.roleCard,
            role === 'admin' ? styles.roleCardActive : styles.roleCardInactive,
          ]}
          onPress={() => onSelectRole('admin')}
        >
          <View style={styles.roleTextContainer}>
            <Text
              style={[
                styles.roleTitle,
                role === 'admin' ? styles.roleTitleActive : styles.roleTitleInactive,
              ]}
            >
              System Administrator (Admin)
            </Text>
            <Text
              style={[
                styles.roleDesc,
                role === 'admin' ? styles.roleDescActive : styles.roleDescInactive,
              ]}
            >
              I want to manage platform users, tasks, and system operations.
            </Text>
          </View>
          <View
            style={[
              styles.radioCircle,
              role === 'admin' ? styles.radioCircleActive : styles.radioCircleInactive,
            ]}
          >
            {role === 'admin' && <View style={styles.radioDot} />}
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
    gap: 10,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  roleCardActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#0B5A3E',
  },
  roleCardInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  roleTextContainer: {
    flex: 1,
    paddingRight: 12,
    gap: 4,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleTitleActive: {
    color: '#0B5A3E',
  },
  roleTitleInactive: {
    color: '#111827',
  },
  roleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  roleDescActive: {
    color: '#047857',
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
    borderColor: '#D1D5DB',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0B5A3E',
  },
});
