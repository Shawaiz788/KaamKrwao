
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CustomInput from './src/components/CustomInput';
import CustomButton from './src/components/CustomButton';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form'

export default function App() {




  const { control, handleSubmit, formState: { errors } } = useForm({})

  const OnSignInPress = (data: any) => {
    console.log('SignIn:', data);
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Sign in</Text>


      <View style={styles.form}>


        <CustomInput
          placeholder='Email'
          name='email'
          autoFocus
          autoCapitalize='none'
          keyboardType='email-address'
          autoComplete='email'
          control={control}
        />
        <CustomInput
          placeholder='Password'
          secureTextEntry
          control={control}
          name='password'
        />
      </View>
      <CustomButton
        text='Sign in'
        onPress={handleSubmit(OnSignInPress)}
      />

      <StatusBar style='auto' />
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  }, form: {
    gap: 5
  }

});