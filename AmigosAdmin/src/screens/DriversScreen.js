import React, { useState, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Modal, TextInput, Alert, ActivityIndicator, Linking 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const COLORS = {
  primary: '#D23F45',    
  secondary: '#FEC94A',  
  dark: '#1F2937', 
  light: '#F3F4F6', 
  white: '#FFFFFF', 
  border: '#E5E7EB'
};

export default function DriversScreen() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New Driver Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // 1. Fetch Drivers
  const fetchDrivers = async () => {
    try {
      const res = await api.get('/admin/drivers');
      setDrivers(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDrivers(); }, []));

  // 2. Add Driver Logic
  const handleAddDriver = async () => {
    if(!name || phone.length < 10 || !password) {
        Alert.alert("Invalid Input", "Please check all fields.");
        return;
    }

    setIsAdding(true);
    try {
        await api.post('/admin/drivers', {
            name: name,
            mobile_no: phone,
            password: password
        });
        
        Alert.alert("Success", "Driver Added!");
        setModalVisible(false);
        setName(''); setPhone(''); setPassword(''); // Reset Form
        fetchDrivers(); // Refresh List

    } catch (error) {
        Alert.alert("Error", "Mobile number might already exist.");
    } finally {
        setIsAdding(false);
    }
  };

  // 3. Delete Logic
  const handleDelete = (id) => {
    Alert.alert("Remove Driver?", "This cannot be undone.", [
        { text: "Cancel" },
        { text: "Delete", style: 'destructive', onPress: async () => {
            await api.delete(`/admin/drivers/${id}`);
            fetchDrivers();
        }}
    ]);
  };

  const callDriver = (number) => Linking.openURL(`tel:${number}`);

  // --- RENDER ITEM ---
  const renderDriver = ({ item }) => (
    <View style={styles.card}>
        <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        
        <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity onPress={() => callDriver(item.mobile_no)}>
                <Text style={styles.phone}>📞 {item.mobile_no}</Text>
            </TouchableOpacity>
            <Text style={styles.status}>● Active</Text>
        </View>

        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fleet Management 🛵</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="#FFF" />
            <Text style={styles.addBtnText}>Add Driver</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
            data={drivers}
            keyExtractor={item => item.id.toString()}
            renderItem={renderDriver}
            contentContainerStyle={{ padding: 15 }}
            ListEmptyComponent={
                <Text style={styles.emptyText}>No drivers found. Add one!</Text>
            }
        />
      )}

      {/* ADD DRIVER MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>New Driver Onboarding</Text>
                
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} placeholder="e.g. Rahul Kumar" value={name} onChangeText={setName} />

                <Text style={styles.label}>Mobile Number</Text>
                <TextInput style={styles.input} placeholder="9876543210" keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} />

                <Text style={styles.label}>Login Password/PIN</Text>
                <TextInput style={styles.input} placeholder="Create a login pin" value={password} onChangeText={setPassword} />

                <View style={styles.modalButtons}>
                    <TouchableOpacity style={[styles.modalBtn, {backgroundColor:'#EEE'}]} onPress={() => setModalVisible(false)}>
                        <Text style={{color:'#333'}}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.modalBtn, {backgroundColor: COLORS.primary}]} onPress={handleAddDriver} disabled={isAdding}>
                        {isAdding ? <ActivityIndicator color="#FFF" /> : <Text style={{color:'#FFF', fontWeight:'bold'}}>Add Driver</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 15, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border 
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },
  
  addBtn: { flexDirection: 'row', backgroundColor: COLORS.dark, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontWeight: '600', marginLeft: 5, fontSize: 12 },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  phone: { color: COLORS.primary, marginTop: 2, fontWeight: '500' },
  status: { fontSize: 10, color: '#10B981', marginTop: 4, fontWeight: 'bold' },
  
  deleteBtn: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 8 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 30 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  label: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 }
});