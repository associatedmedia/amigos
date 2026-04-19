import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Pressable, Platform, ScrollView } from 'react-native';
import { useCart } from '../context/CartContext';

const { width, height } = Dimensions.get('window');
const PRIMARY_RED = '#D23F45';

const VariantSelectionModal = ({ isVisible, onClose, currentProduct, onVariantAdded }) => {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (currentProduct?.variants && Array.isArray(currentProduct.variants) && currentProduct.variants.length > 0) {
      setSelectedVariant(currentProduct.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [currentProduct]);

  if (!isVisible || !currentProduct) return null;

  const currentPrice = selectedVariant ? selectedVariant.price : (currentProduct.price || 0);

  const handleAdd = () => {
    addToCart(currentProduct, selectedVariant);
    onClose();
    if (onVariantAdded) {
       onVariantAdded(currentProduct);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalBody} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.mainProductName}>{currentProduct.name}</Text>
            {currentProduct.description ? (
              <Text style={styles.mainProductDesc}>{currentProduct.description}</Text>
            ) : null}

            {currentProduct?.variants && Array.isArray(currentProduct.variants) && currentProduct.variants.length > 0 ? (
              <View style={styles.variantsSection}>
                <Text style={styles.variantsTitle}>Choose Size:</Text>
                {currentProduct.variants.map((v) => {
                  const isSelected = selectedVariant && selectedVariant.id === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id.toString()}
                      style={[styles.radioRow, isSelected && styles.radioRowSelected]}
                      onPress={() => setSelectedVariant(v)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioCircle}>
                        {isSelected ? <View style={styles.radioDot} /> : null}
                      </View>
                      <Text style={[styles.variantName, isSelected && styles.variantNameSelected]}>
                        {v.variant_name}
                      </Text>
                      <Text style={[styles.variantPrice, isSelected && styles.variantPriceSelected]}>
                        ₹{v.price}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.mainAddBtn} onPress={handleAdd}>
              <Text style={styles.mainAddBtnText}>Add Item • ₹{currentPrice}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBody: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    maxHeight: '80%'
  },
  handle: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  mainProductName: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 5 },
  mainProductDesc: { fontSize: 14, color: '#666', marginBottom: 15 },
  variantsSection: { marginBottom: 10 },
  variantsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 12, marginBottom: 8, backgroundColor: '#fafafa' },
  radioRowSelected: { borderColor: PRIMARY_RED, backgroundColor: '#fff5f5' },
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#aaa', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioDot: { height: 10, width: 10, borderRadius: 5, backgroundColor: PRIMARY_RED },
  variantName: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },
  variantNameSelected: { color: PRIMARY_RED, fontWeight: 'bold' },
  variantPrice: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  variantPriceSelected: { color: PRIMARY_RED },
  footer: { paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  mainAddBtn: { backgroundColor: PRIMARY_RED, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  mainAddBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default VariantSelectionModal;