import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DropdownSelectorProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  placeholder: string;
  zIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  errorMsg?: string | null;
  setErrorMsg?: (msg: string | null) => void;
}

export default function DropdownSelector({
  label,
  value,
  options,
  onSelect,
  placeholder,
  zIndex,
  isOpen,
  onToggle,
  errorMsg,
  setErrorMsg,
}: DropdownSelectorProps) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ zIndex }}>
        <Pressable style={styles.dropdownTrigger} onPress={onToggle}>
          <Text style={value ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
            {value || placeholder}
          </Text>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#4B5563"
          />
        </Pressable>

        {isOpen && (
          <View style={styles.dropdownList}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
              {options.map((opt, idx) => (
                <Pressable
                  key={idx}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(opt);
                    if (errorMsg && setErrorMsg) setErrorMsg(null);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{opt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
  },
  dropdownTextPlaceholder: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownTextSelected: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    maxHeight: 200,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
});
