// File: RechargeAppComplete.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, 
  TextInput, FlatList, Image, Modal, Pressable, Alert 
} from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import 'intl-pluralrules';

// ==================== i18n Setup ====================
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          signup: {
            title: "Create Account",
            fullName: "Full Name",
            mobile: "Mobile Number",
            password: "Password",
            submit: "Sign Up"
          }
        }
      },
      bn: {
        translation: {
          signup: {
            title: "অ্যাকাউন্ট তৈরি করুন",
            fullName: "পুরো নাম",
            mobile: "মোবাইল নম্বর",
            password: "পাসওয়ার্ড",
            submit: "নিবন্ধন করুন"
          }
        }
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// ==================== Zustand Stores ====================
interface AuthState {
  accessToken: string | null;
  user: {
    id: string;
    mobile: string;
  } | null;
  login: (mobile: string, password: string) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      login: async (mobile, password) => {
        const res = await fetch(`${Constants.expoConfig?.extra?.API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, password })
        });
        const data = await res.json();
        set({ accessToken: data.accessToken, user: data.user });
      },
      logout: () => set({ accessToken: null, user: null })
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => SecureStore)
    }
  )
);

// ==================== Components ====================
const Input = ({ control, name, label, rules, ...props }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <>
          <TextInput
            style={[styles.input, error && styles.errorInput]}
            value={value}
            onChangeText={onChange}
            {...props}
          />
          {error && <Text style={styles.errorText}>{error.message}</Text>}
        </>
      )}
    />
  </View>
);

const Button = ({ title, onPress, loading }: any) => (
  <TouchableOpacity 
    style={styles.button} 
    onPress={onPress}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.buttonText}>{title}</Text>
    )}
  </TouchableOpacity>
);

// ==================== Screens ====================
const SignupScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { login } = useAuthStore();

  const schema = z.object({
    fullName: z.string().min(3),
    mobile: z.string().length(10),
    password: z.string().min(6)
  });

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: any) => {
    try {
      await login(data.mobile, data.password);
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Signup failed');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('signup.title')}</Text>
      
      <Input
        control={control}
        name="fullName"
        label={t('signup.fullName')}
        rules={{ required: true }}
      />
      
      <Input
        control={control}
        name="mobile"
        label={t('signup.mobile')}
        keyboardType="phone-pad"
        rules={{ required: true }}
      />
      
      <Input
        control={control}
        name="password"
        label={t('signup.password')}
        secureTextEntry
        rules={{ required: true }}
      />
      
      <Button 
        title={t('signup.submit')} 
        onPress={handleSubmit(onSubmit)} 
      />
    </ScrollView>
  );
};

const HomeScreen = () => {
  const { user, logout } = useAuthStore();
  return (
    <View style={styles.container}>
      <Text>Welcome {user?.mobile}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
};

// ==================== Navigation ====================
const AuthStack = createNativeStackNavigator();
const AuthStackScreen = () => (
  <AuthStack.Navigator>
    <AuthStack.Screen name="Signup" component={SignupScreen} />
  </AuthStack.Navigator>
);

const MainStack = createNativeStackNavigator();
const MainStackScreen = () => (
  <MainStack.Navigator>
    <MainStack.Screen name="Home" component={HomeScreen} />
  </MainStack.Navigator>
);

const AppNavigator = () => {
  const { accessToken } = useAuthStore();
  return accessToken ? <MainStackScreen /> : <AuthStackScreen />;
};

// ==================== Main App ====================
export default function RechargeAppComplete() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

// ==================== Styles ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  inputContainer: {
    marginBottom: 15
  },
  label: {
    marginBottom: 5,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16
  },
  errorInput: {
    borderColor: 'red'
  },
  errorText: {
    color: 'red',
    marginTop: 5
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});