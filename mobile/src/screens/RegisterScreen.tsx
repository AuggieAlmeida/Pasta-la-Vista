import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterInput } from '../types/auth';
import { useAuthStore } from '../stores/auth.store';
import api from '../api/axios';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });
  const { setAuth, setError } = useAuthStore();

  const onSubmit = async (data: RegisterInput): Promise<void> => {
    try {
      setIsLoading(true);

      const response = await api.post('/api/v1/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });

      const { user, access_token, refresh_token } = response.data.data;

      // Salvar no Zustand
      setAuth(user, access_token, refresh_token);

      // Auto-login para home
      navigation.replace('ClientNavigator');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao cadastrar';
      setError(message);
      Alert.alert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.logo}>🍝</Text>
          <Text style={styles.title}>Cadastro</Text>
          <Text style={styles.subtitle}>Criar nova conta</Text>

          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nome Completo</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Seu nome completo"
                    value={value}
                    onChangeText={onChange}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="seu@email.com"
                    value={value}
                    onChangeText={onChange}
                    editable={!isLoading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Telefone (opcional)</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    placeholder="(11) 99999-9999"
                    value={value}
                    onChangeText={onChange}
                    editable={!isLoading}
                    keyboardType="phone-pad"
                  />
                )}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Senha</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry
                    editable={!isLoading}
                  />
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <Controller
                control={control}
                name="passwordConfirm"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    style={[styles.input, errors.passwordConfirm && styles.inputError]}
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry
                    editable={!isLoading}
                  />
                )}
              />
              {errors.passwordConfirm && (
                <Text style={styles.errorText}>{errors.passwordConfirm.message}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Entre aqui</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#FF3333',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3333',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
});
