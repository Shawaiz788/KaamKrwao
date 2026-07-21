import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GenderSelectorProps {
  gender: string;
  onSelectGender: (val: string) => void;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

const GENDER_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Male: 'male',
  Female: 'female',
  Other: 'people',
};

export default function GenderSelector({ gender, onSelectGender }: GenderSelectorProps) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>Select your Gender</Text>
      <View style={styles.gridContainer}>
        {GENDER_OPTIONS.map((genderName) => {
          const isSelected = gender.toLowerCase() === genderName.toLowerCase();
          return (
            <Pressable
              key={genderName}
              style={[
                styles.gridCard,
                isSelected ? styles.gridCardActive : styles.gridCardInactive,
                { width: '30.5%' },
              ]}
              onPress={() => onSelectGender(genderName.toLowerCase())}
            >
              <Ionicons
                name={GENDER_ICONS[genderName]}
                size={18}
                color={isSelected ? '#FFFFFF' : '#4B5563'}
              />
              <Text
                style={[
                  styles.gridCardText,
                  isSelected ? styles.gridCardTextActive : styles.gridCardTextInactive,
                  { fontSize: 13 },
                ]}
              >
                {genderName}
              </Text>
            </Pressable>
          );
        })}
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  gridCardActive: {
    backgroundColor: '#0B5A3E',
    borderColor: '#0B5A3E',
  },
  gridCardInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  gridCardText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridCardTextActive: {
    color: '#FFFFFF',
  },
  gridCardTextInactive: {
    color: '#4B5563',
  },
});
