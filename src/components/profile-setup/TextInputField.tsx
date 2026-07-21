import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TextInputFieldProps {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  placeholder: string;
  isValid: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
}

export default function TextInputField({
  label,
  value,
  onChangeText,
  placeholder,
  isValid,
  icon,
  keyboardType,
  autoCapitalize,
  errorMsg,
  setErrorMsg,
}: TextInputFieldProps) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputFieldContainer,
          isValid && { borderColor: '#16A34A' },
        ]}
      >
        <Ionicons name={icon} size={20} color="#9CA3AF" style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onChangeText={(val) => {
            onChangeText(val);
            if (errorMsg) setErrorMsg(null);
          }}
        />
        <View style={styles.indicatorContainer}>
          {isValid ? (
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
          ) : (
            <View style={styles.dotIndicator} />
          )}
        </View>
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
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  indicatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    marginLeft: 8,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
});
