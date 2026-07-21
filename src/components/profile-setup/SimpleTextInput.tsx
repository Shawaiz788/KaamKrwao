import React from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';

interface SimpleTextInputProps {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
}

export default function SimpleTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  errorMsg,
  setErrorMsg,
}: SimpleTextInputProps) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputFieldContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          value={value}
          onChangeText={(val) => {
            onChangeText(val);
            if (errorMsg) setErrorMsg(null);
          }}
        />
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
  textInput: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
});
