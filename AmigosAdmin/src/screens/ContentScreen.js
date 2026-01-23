import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Image, Modal, TextInput, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Import Image Picker
import api from '../services/api';

const COLORS = {
  primary: '#D23F45',
  dark: '#1A1A1A',
  white: '#FFFFFF',
  lightGrey: '#F8F8F8',
  border: '#EEEEEE',
};

const ContentScreen = () => {
  const [activeTab, setActiveTab] = useState('banners'); // Default to banners for now
  const [data, setData] = useState({ products: [], banners: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [bannerForm, setBannerForm] = useState({
    imageUri: null, // Local URI for preview
    title: '',
    sub: '',
    targetScreen: 'CategoryDetail',
    categoryId: '', // We will pack this into targetParams
    categoryName: ''
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/content');
      setData(res.data);
    } catch (error) {
      console.log("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
          try {
            const endpoint = type === 'products' ? `/admin/product/${id}` : `/admin/banner/${id}`;
            await api.delete(endpoint);
            fetchContent();
          } catch (e) {
            Alert.alert("Error", "Could not delete item.");
          }
      }}
    ]);
  };

  // --- IMAGE PICKER ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Banner aspect ratio
      quality: 0.8,
    });

    if (!result.canceled) {
      setBannerForm({ ...bannerForm, imageUri: result.assets[0].uri });
    }
  };

  // --- SUBMIT BANNER ---
  const handleAddBanner = async () => {
    if (!bannerForm.imageUri) {
      Alert.alert("Missing Image", "Please select a banner image.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      
      // 1. Append Image File
      const uri = bannerForm.imageUri;
      const fileType = uri.split('.').pop();
      formData.append('image', {
        uri,
        name: `banner_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });

      // 2. Append Text Fields
      formData.append('title', bannerForm.title);
      formData.append('sub', bannerForm.sub);
      formData.append('target_screen', bannerForm.targetScreen);
      
      // 3. Construct Target Params JSON
      const params = {
        categoryId: bannerForm.categoryId,
        categoryName: bannerForm.categoryName
      };
      formData.append('target_params', JSON.stringify(params));

      // 4. Send as Multipart Form Data
      // Note: Axios usually handles Content-Type automatically for FormData
      await api.post('/admin/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setModalVisible(false);
      setBannerForm({ imageUri: null, title: '', sub: '', targetScreen: 'CategoryDetail', categoryId: '', categoryName: '' });
      fetchContent();

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to upload banner.");
    } finally {
      setUploading(false);
    }
  };

  const renderBanner = ({ item }) => (
    <View style={styles.bannerCard}>
      <Image source={{ uri: item.image }} style={styles.bannerImage} />
      <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <Text style={styles.bannerSub}>{item.sub}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id, 'banners')} style={styles.deleteBtnBg}>
            <Ionicons name="trash" size={20} color="white" />
          </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER TABS (Simplified for Banner Focus) */}
      <View style={styles.tabContainer}>
         <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>BANNERS MANAGER</Text>
         </TouchableOpacity>
      </View>

      {/* LIST CONTENT */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={data.banners}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBanner}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No banners found.</Text>}
        />
      )}

      {/* FAB ADD BUTTON */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* ADD BANNER MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Banner</Text>
            
            <ScrollView>
                {/* Image Picker */}
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {bannerForm.imageUri ? (
                        <Image source={{ uri: bannerForm.imageUri }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <View style={{alignItems:'center'}}>
                            <Ionicons name="camera" size={30} color="#999" />
                            <Text style={{color:'#999'}}>Tap to Select Image</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TextInput 
                    placeholder="Title (e.g. 50% OFF)" 
                    style={styles.input} 
                    value={bannerForm.title}
                    onChangeText={t => setBannerForm({...bannerForm, title: t})} 
                />
                <TextInput 
                    placeholder="Sub Title (e.g. On all Pizzas)" 
                    style={styles.input} 
                    value={bannerForm.sub}
                    onChangeText={t => setBannerForm({...bannerForm, sub: t})} 
                />

                <Text style={styles.label}>Target Action:</Text>
                <View style={styles.row}>
                    <TextInput 
                        placeholder="Cat ID (e.g. 1)" 
                        keyboardType="numeric"
                        style={[styles.input, {flex:1, marginRight:5}]} 
                        value={bannerForm.categoryId}
                        onChangeText={t => setBannerForm({...bannerForm, categoryId: t})} 
                    />
                    <TextInput 
                        placeholder="Cat Name (e.g. Pizza)" 
                        style={[styles.input, {flex:2}]} 
                        value={bannerForm.categoryName}
                        onChangeText={t => setBannerForm({...bannerForm, categoryName: t})} 
                    />
                </View>

                {uploading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} />
                ) : (
                    <TouchableOpacity style={styles.saveBtn} onPress={handleAddBanner}>
                        <Text style={styles.saveBtnText}>Upload & Save</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGrey },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 10 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontWeight: 'bold', color: COLORS.primary, fontSize: 14 },
  
  list: { padding: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },

  bannerCard: { marginBottom: 15, borderRadius: 10, overflow: 'hidden', height: 160, backgroundColor:'#000' },
  bannerImage: { width: '100%', height: '100%', opacity: 0.8 },
  bannerOverlay: { position: 'absolute', bottom: 10, left: 10, right: 10 },
  bannerTitle: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  bannerSub: { color: 'white', fontSize: 14 },
  deleteBtnBg: { position: 'absolute', right: 0, bottom: 0, backgroundColor: 'red', padding: 8, borderRadius: 20 },

  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: COLORS.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  
  imagePicker: { 
      height: 150, backgroundColor: '#eee', borderRadius: 10, 
      justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow: 'hidden'
  },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 10 },
  label: { fontWeight: 'bold', marginBottom: 5, color: '#666' },
  row: { flexDirection: 'row' },

  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  cancelBtn: { padding: 15, alignItems: 'center' },
  cancelBtnText: { color: '#666' }
});

export default ContentScreen;