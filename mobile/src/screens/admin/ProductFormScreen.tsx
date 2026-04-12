import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import {
  useCreateProduct,
  useUpdateProduct,
  useUploadProductImage,
} from '../../hooks/useAdmin';
import { IProduct, ICustomization } from '../../types/menu';

const COLORS = {
  primary: '#FF6B35',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1a1a1a',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  sizeAccent: '#2563EB',
  ingredientAccent: '#059669',
  variationAccent: '#7C3AED',
};

type CustomizationKind = 'size' | 'ingredient' | 'variation';

interface CustomRow {
  key: string;
  name: string;
  priceModifier: string;
  available: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'pizzas', label: 'Pizzas' },
  { value: 'massas', label: 'Massas' },
  { value: 'entradas', label: 'Entradas' },
  { value: 'saladas', label: 'Saladas' },
  { value: 'sobremesas', label: 'Sobremesas' },
  { value: 'bebidas', label: 'Bebidas' },
] as const;

function newRowKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowsFromCustomizations(
  list: ICustomization[] | undefined,
  kind: CustomizationKind
): CustomRow[] {
  return (list || [])
    .filter((c) => c.type === kind)
    .map((c) => ({
      key: c._id || newRowKey(),
      name: c.name,
      priceModifier: String(c.price_modifier),
      available: c.available !== false,
    }));
}

function parseModifier(raw: string): number {
  const n = parseFloat(raw.replace(',', '.').trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function buildPayloadRows(rows: CustomRow[], type: CustomizationKind) {
  return rows
    .filter((r) => r.name.trim().length > 0)
    .map((r) => ({
      type,
      name: r.name.trim(),
      price_modifier: parseModifier(r.priceModifier),
      available: r.available,
    }));
}

interface CustomizationSectionProps {
  title: string;
  hint: string;
  accent: string;
  rows: CustomRow[];
  onChangeRows: (rows: CustomRow[]) => void;
  disabled: boolean;
}

const CustomizationSection: React.FC<CustomizationSectionProps> = ({
  title,
  hint,
  accent,
  rows,
  onChangeRows,
  disabled,
}) => {
  const addRow = useCallback(() => {
    onChangeRows([
      ...rows,
      { key: newRowKey(), name: '', priceModifier: '0', available: true },
    ]);
  }, [rows, onChangeRows]);

  const removeRow = useCallback(
    (key: string) => {
      onChangeRows(rows.filter((r) => r.key !== key));
    },
    [rows, onChangeRows]
  );

  const patchRow = useCallback(
    (key: string, patch: Partial<Pick<CustomRow, 'name' | 'priceModifier' | 'available'>>) => {
      onChangeRows(
        rows.map((r) => (r.key === key ? { ...r, ...patch } : r))
      );
    },
    [rows, onChangeRows]
  );

  return (
    <View style={[styles.customSection, { borderLeftColor: accent }]}>
      <View style={styles.customSectionHeader}>
        <Text style={styles.customSectionTitle}>{title}</Text>
        <TouchableOpacity
          style={[styles.addChip, { borderColor: accent }]}
          onPress={addRow}
          disabled={disabled}
        >
          <Feather name="plus" size={18} color={accent} />
          <Text style={[styles.addChipText, { color: accent }]}>Adicionar</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.customHint}>{hint}</Text>
      {rows.length === 0 ? (
        <Text style={styles.customEmpty}>Nenhum item — opcional.</Text>
      ) : (
        rows.map((row) => (
          <View key={row.key} style={styles.customRow}>
            <View style={styles.customRowMain}>
              <TextInput
                style={[styles.input, styles.customNameInput]}
                value={row.name}
                onChangeText={(t) => patchRow(row.key, { name: t })}
                placeholder="Nome (ex: Média 8 fatias)"
                editable={!disabled}
              />
              <View style={styles.modifierWrap}>
                <Text style={styles.modifierPrefix}>+ R$</Text>
                <TextInput
                  style={[styles.input, styles.modifierInput]}
                  value={row.priceModifier}
                  onChangeText={(t) => patchRow(row.key, { priceModifier: t })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  editable={!disabled}
                />
              </View>
            </View>
            <View style={styles.customRowFooter}>
              <View style={styles.availToggle}>
                <Text style={styles.availLabel}>Disponível</Text>
                <Switch
                  value={row.available}
                  onValueChange={(v) => patchRow(row.key, { available: v })}
                  trackColor={{ false: COLORS.border, true: accent }}
                  thumbColor="#FFF"
                  disabled={disabled}
                />
              </View>
              <TouchableOpacity
                onPress={() => removeRow(row.key)}
                disabled={disabled}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

export const ProductFormScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();

  const productToEdit = route.params?.product as IProduct | undefined;
  const isEditing = !!productToEdit;

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const uploadImageMutation = useUploadProductImage();

  const defaultCategory =
    productToEdit?.category &&
    CATEGORY_OPTIONS.some((o) => o.value === productToEdit.category)
      ? productToEdit.category
      : 'massas';

  const [name, setName] = useState(productToEdit?.name || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [price, setPrice] = useState(productToEdit?.price?.toString() || '');
  const [category, setCategory] = useState<string>(defaultCategory);
  const [prepTime, setPrepTime] = useState(productToEdit?.preparation_time?.toString() || '15');
  const [active, setActive] = useState(productToEdit ? productToEdit.active : true);

  const [sizeRows, setSizeRows] = useState<CustomRow[]>(() =>
    rowsFromCustomizations(productToEdit?.customizations, 'size')
  );
  const [ingredientRows, setIngredientRows] = useState<CustomRow[]>(() =>
    rowsFromCustomizations(productToEdit?.customizations, 'ingredient')
  );
  const [variationRows, setVariationRows] = useState<CustomRow[]>(() =>
    rowsFromCustomizations(productToEdit?.customizations, 'variation')
  );

  const [imageUri, setImageUri] = useState<string | null>(productToEdit?.image || null);
  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Editar Produto' : 'Novo Produto',
    });
  }, [isEditing, navigation]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permissão negada',
        text2: 'Precisamos de permissão para acessar a galeria.',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !category) {
      Toast.show({
        type: 'error',
        text1: 'Campos incompletos',
        text2: 'Preencha os campos obrigatórios (Nome, Preço e Categoria)',
      });
      return;
    }

    const customizations = [
      ...buildPayloadRows(sizeRows, 'size'),
      ...buildPayloadRows(ingredientRows, 'ingredient'),
      ...buildPayloadRows(variationRows, 'variation'),
    ];

    const productData = {
      name,
      description,
      price: parseFloat(price.replace(',', '.')),
      category,
      preparation_time: parseInt(prepTime, 10),
      active,
      customizations,
    };

    try {
      let productId = productToEdit?._id;

      if (isEditing && productId) {
        await updateMutation.mutateAsync({ id: productId, data: productData });
      } else {
        const newProduct = await createMutation.mutateAsync(productData);
        productId = newProduct._id;
      }

      if (imageChanged && imageUri && !imageUri.startsWith('http') && productId) {
        await uploadImageMutation.mutateAsync({
          productId,
          imageUri,
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Produto salvo no cardápio!',
      });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Falha ao salvar',
        text2: error?.response?.data?.message || 'Erro de conexão com servidor',
      });
    }
  };

  const isSaving =
    createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imageSection}>
        <TouchableOpacity style={styles.imageContainer} onPress={handlePickImage} disabled={isSaving}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather name="camera" size={32} color={COLORS.textMuted} />
              <Text style={styles.imagePlaceholderText}>Adicionar Foto</Text>
            </View>
          )}
          <View style={styles.imageOverlay}>
            <Text style={styles.imageOverlayText}>Alterar</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nome do Produto *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Macarrão à Bolonhesa"
          editable={!isSaving}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Categoria *</Text>
        <View style={styles.categoryWrap}>
          {CATEGORY_OPTIONS.map((opt) => {
            const selected = category === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                onPress={() => setCategory(opt.value)}
                disabled={isSaving}
              >
                <Text
                  style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Preço base (R$) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
            editable={!isSaving}
          />
        </View>
        <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.label}>Tempo Prep. (min)</Text>
          <TextInput
            style={styles.input}
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="number-pad"
            placeholder="15"
            editable={!isSaving}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Descreva o prato..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!isSaving}
        />
      </View>

      <Text style={styles.sectionHeading}>Opções do cardápio</Text>
      <Text style={styles.sectionSub}>
        Escolha as opções de tamanho, ingredientes e variantes que o cliente pode escolher.
      </Text>

      <CustomizationSection
        title="Tamanhos"
        hint="Cliente escolhe um tamanho (ex.: pizza por fatias, taça de vinho)."
        accent={COLORS.sizeAccent}
        rows={sizeRows}
        onChangeRows={setSizeRows}
        disabled={isSaving}
      />
      <CustomizationSection
        title="Ingredientes extras"
        hint="Opcionais adicionais; o cliente pode marcar vários."
        accent={COLORS.ingredientAccent}
        rows={ingredientRows}
        onChangeRows={setIngredientRows}
        disabled={isSaving}
      />
      <CustomizationSection
        title="Variantes"
        hint="Uma opção entre várias (ex.: sabor do gelato, tipo de água)."
        accent={COLORS.variationAccent}
        rows={variationRows}
        onChangeRows={setVariationRows}
        disabled={isSaving}
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Produto Ativo no Cardápio</Text>
        <Switch
          value={active}
          onValueChange={setActive}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor="#FFF"
          disabled={isSaving}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Salvar Produto</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 100,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FFF',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginBottom: 16,
  },
  customSection: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  customSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  customHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 17,
  },
  customEmpty: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  addChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customRow: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  customRowMain: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  customNameInput: {
    flex: 1,
    marginBottom: 0,
  },
  modifierWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 120,
  },
  modifierPrefix: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginRight: 4,
  },
  modifierInput: {
    flex: 1,
    minWidth: 56,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  customRowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  availToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
