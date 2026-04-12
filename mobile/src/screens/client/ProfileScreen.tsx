import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { profileApi, UserAddress, UserCard } from '../../api/endpoints/profile.api';
import Toast from 'react-native-toast-message';
import { AddressModal } from '../../components/AddressModal';
import { CardModal } from '../../components/CardModal';


export const ProfileScreen: React.FC = () => {
  const { user, clearAuth } = useAuthStore();

  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: profileApi.getAddresses,
  });

  const { data: cards, isLoading: loadingCards } = useQuery({
    queryKey: ['user-cards'],
    queryFn: profileApi.getCards,
  });

  const [addressModalVisible, setAddressModalVisible] = React.useState(false);
  const [cardModalVisible, setCardModalVisible] = React.useState(false);
  const queryClient = useQueryClient();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Atenção',
      'Você tem certeza que deseja deletar sua conta? Seus dados pessoais serão anonimizados perante a LGPD e o acesso será perdido irreversivelmente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Deletar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await profileApi.deleteAccount();
              Toast.show({ type: 'success', text1: 'Conta deletada' });
              clearAuth();
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Erro ao deletar conta' });
            }
          }
        }
      ]
    );
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await profileApi.deleteAddress(id);
      Toast.show({ type: 'success', text1: 'Endereço Removido' });
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Falha ao remover' });
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      await profileApi.deleteCard(id);
      Toast.show({ type: 'success', text1: 'Cartão Removido' });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Falha ao remover' });
    }
  };


  const renderAddress = ({ item }: { item: UserAddress }) => (
    <View style={styles.cardItem}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardLabel}>{item.street}, {item.number}</Text>
        <Text style={styles.cardSub}>{item.city} - {item.state} | {item.zip}</Text>
        {item.isDefault && <Text style={styles.defaultTag}>Padrao</Text>}
      </View>
      <TouchableOpacity onPress={() => handleDeleteAddress(item.id)} style={styles.trashBtn}>
        <FontAwesome5 name="trash-alt" size={16} color="#FF4444" />
      </TouchableOpacity>
    </View>
  );

  const renderCard = ({ item }: { item: UserCard }) => {
    const b = (item.brand || '').toLowerCase();
    const icon =
      b === 'visa' ? 'cc-visa' : b === 'mastercard' ? 'cc-mastercard' : 'credit-card';
    return (
    <View style={styles.cardItem}>
      <View style={styles.cardRow}>
        <FontAwesome5 name={icon} size={24} color="#333" />
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>Final {item.last4}</Text>
          {item.isDefault && <Text style={styles.defaultTag}>Padrao</Text>}
        </View>
      </View>
      <TouchableOpacity onPress={() => handleDeleteCard(item.id)} style={styles.trashBtn}>
        <FontAwesome5 name="trash-alt" size={16} color="#FF4444" />
      </TouchableOpacity>
    </View>
  );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.titleText}>Meu Perfil</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <FontAwesome5 name="user-alt" size={32} color="#FF6B35" />
        </View>
        <Text style={styles.title}>{user?.name}</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meus Endereços</Text>
            <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                <FontAwesome5 name="plus" size={14} color="#FF6B35" />
            </TouchableOpacity>
        </View>
        {loadingAddresses ? (
          <ActivityIndicator color="#FF6B35" />
        ) : addresses && addresses.length > 0 ? (
          <FlatList
            data={addresses}
            renderItem={renderAddress}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>Nenhum endereco salvo.</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meus Cartões</Text>
            <TouchableOpacity onPress={() => setCardModalVisible(true)}>
                <FontAwesome5 name="plus" size={14} color="#FF6B35" />
            </TouchableOpacity>
        </View>
        {loadingCards ? (
          <ActivityIndicator color="#FF6B35" />
        ) : cards && cards.length > 0 ? (
          <FlatList
            data={cards}
            renderItem={renderCard}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>Nenhum cartao salvo.</Text>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={() => clearAuth()}>
        <FontAwesome5 name="sign-out-alt" size={16} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Excluir minha conta</Text>
      </TouchableOpacity>
      </ScrollView>

      <AddressModal visible={addressModalVisible} onClose={() => setAddressModalVisible(false)} />
      <CardModal visible={cardModalVisible} onClose={() => setCardModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  topHeader: { backgroundColor: '#FF6B35', padding: 20, paddingBottom: 10 },
  titleText: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginTop: 10 },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEFE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  cardSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  defaultTag: {
    fontSize: 10,
    color: '#FF6B35',
    backgroundColor: '#FFEFE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    fontWeight: '700',
  },
  trashBtn: {
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  deleteText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
});
