import React, { useState } from 'react';
import { TextInput, StyleSheet, TextInputProps, Text, View, Pressable, ViewStyle } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

type CustomInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  containerStyle?: ViewStyle;
} & TextInputProps;

export default function CustomInput<T extends FieldValues>({
  control,
  name,
  label,
  containerStyle,
  ...props
}: CustomInputProps<T>) {
  const [isSecured, setIsSecured] = useState(props.secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={[styles.container, containerStyle]}>
          {label && <Text style={styles.label}>{label}</Text>}
          
          <View 
            style={[
              styles.inputWrapper,
              { 
                borderColor: error ? '#EF4444' : isFocused ? '#16A34A' : '#E5E7EB',
                backgroundColor: isFocused ? '#FFFFFF' : '#F3F4F6'
              }
            ]}
          >
            <TextInput
              {...props}
              value={value}
              onChangeText={onChange}
              onBlur={(e) => {
                onBlur();
                setIsFocused(false);
                if (props.onBlur) props.onBlur(e);
              }}
              onFocus={(e) => {
                setIsFocused(true);
                if (props.onFocus) props.onFocus(e);
              }}
              secureTextEntry={isSecured}
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />
            
            {props.secureTextEntry && (
              <Pressable 
                onPress={() => setIsSecured(!isSecured)} 
                style={styles.eyeIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={isSecured ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </Pressable>
            )}
          </View>
          
          {error ? (
            <Text style={styles.error}>{error.message}</Text>
          ) : (
            <View style={{ height: 4 }} />
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#1F2937',
    fontSize: 15,
  },
  eyeIcon: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});