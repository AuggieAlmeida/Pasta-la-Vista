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
import { profileApi, UserCard } from '../api/endpoints/profile.api';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { CardField, useStripe } from '@stripe/stripe-react-native';


const cardSchema = z.object({
  brand: z.string().optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

interface CardModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (card: UserCard) => void;
}

export const CardModal: React.FC<CardModalProps> = ({ visible, onClose, onSaved }) => {
  const queryClient = useQueryClient();
  const { createPaymentMethod } = useStripe();
  const [cardDetails, setCardDetails] = React.useState<any>(null);

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
  });

  const onSubmit = async () => {
    if (!cardDetails?.complete) {
      Toast.show({ type: 'error', text1: 'Preencha os dados do cartão' });
      return;
    }

    try {
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (error) {
        Toast.show({ type: 'error', text1: 'Erro no processamento', text2: error.message });
        return;
      }

      const created = await profileApi.addCard({
        last4: paymentMethod?.Card.last4 || '****',
        brand: paymentMethod?.Card.brand || 'unknown',
        isDefault: false,
        stripePaymentMethodId: paymentMethod?.id || 'pm_mock',
      });

      Toast.show({ type: 'success', text1: 'Cartão adicionado!' });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      onSaved?.(created);
      reset();
      onClose();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao adicionar cartão' });
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
            <Text style={styles.title}>Novo Cartão</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.cardContainer}>
              <Text style={styles.label}>Dados do Cartão</Text>
              <CardField
                postalCodeEnabled={false}
                placeholder={{
                  number: '0000 0000 0000 0000',
                }}
                cardStyle={{
                  backgroundColor: '#F5F5F5',
                  textColor: '#333',
                  placeholderColor: '#999',
                  borderRadius: 12,
                }}
                style={styles.cardField}
                onCardChange={(details) => setCardDetails(details)}
              />
            </View>

            <View style={styles.securityInfo}>
              <FontAwesome5 name="lock" size={12} color="#4CAF50" />
              <Text style={styles.securityText}>Seus dados são criptografados pelo Stripe</Text>
            </View>


            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Salvar Cartão</Text>
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
  brandRow: {
    flexDirection: 'row',
    gap: 16,
  },
  brandBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  brandBtnActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF8F5',
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 10,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
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

