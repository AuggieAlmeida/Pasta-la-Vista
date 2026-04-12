import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { profileApi, UserAddress } from '../api/endpoints/profile.api';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';


const addressSchema = z.object({
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'UF inválida (Ex: SP)'),
  zip: z.string().min(9, 'CEP incompleto').max(9),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  /** Chamado após salvar com sucesso (ex.: selecionar no carrinho). */
  onSaved?: (address: UserAddress) => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({ visible, onClose, onSaved }) => {
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const zipCode = watch('zip');

  React.useEffect(() => {
    const fetchAddress = async (cep: string) => {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        try {
          const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
          if (!response.data.erro) {
            setValue('street', response.data.logradouro);
            setValue('city', response.data.localidade);
            setValue('state', response.data.uf);
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error);
        }
      }
    };

    if (zipCode) {
      fetchAddress(zipCode);
    }
  }, [zipCode, setValue]);

  const maskCep = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 5) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
    }
    return cleaned;
  };


  const onSubmit = async (data: AddressFormData) => {
    try {
      const created = await profileApi.addAddress({
        ...data,
        isDefault: false,
      });
      Toast.show({ type: 'success', text1: 'Endereço adicionado!' });
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      onSaved?.(created);
      reset();
      onClose();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao adicionar endereço' });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Novo Endereço</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Logradouro (Rua/Av)</Text>
              <Controller
                control={control}
                name="street"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.street && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Ex: Rua das Flores"
                  />
                )}
              />
              {errors.street && <Text style={styles.errorText}>{errors.street.message}</Text>}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Número</Text>
                <Controller
                  control={control}
                  name="number"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.number && styles.inputError]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="123"
                    />
                  )}
                />
                {errors.number && <Text style={styles.errorText}>{errors.number.message}</Text>}
              </View>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>Complemento (Opcional)</Text>
                <Controller
                  control={control}
                  name="complement"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Bloco A, Ap 10"
                    />
                  )}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cidade</Text>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.city && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Sua Cidade"
                  />
                )}
              />
              {errors.city && <Text style={styles.errorText}>{errors.city.message}</Text>}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>UF</Text>
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.state && styles.inputError]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="SP"
                      autoCapitalize="characters"
                      maxLength={2}
                    />
                  )}
                />
                {errors.state && <Text style={styles.errorText}>{errors.state.message}</Text>}
              </View>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>CEP</Text>
                <Controller
                  control={control}
                  name="zip"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.zip && styles.inputError]}
                      value={value}
                      onChangeText={(text) => onChange(maskCep(text))}
                      placeholder="00000-000"
                      keyboardType="numeric"
                      maxLength={9}
                    />
                  )}
                />
                {errors.zip && <Text style={styles.errorText}>{errors.zip.message}</Text>}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Salvar Endereço</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  form: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
