import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface CardModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (card: any) => void;
}

/**
 * Web stub – CardField / useStripe from @stripe/stripe-react-native
 * are native-only. This placeholder informs the user.
 */
export const CardModal: React.FC<CardModalProps> = ({ visible, onClose }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Novo Cartão</Text>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome5 name="times" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <Text style={styles.message}>
          Adicionar cartão não é suportado na versão web. Use o aplicativo no celular.
        </Text>
      </View>
    </View>
  </Modal>
);

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
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 32,
    lineHeight: 20,
  },
});
