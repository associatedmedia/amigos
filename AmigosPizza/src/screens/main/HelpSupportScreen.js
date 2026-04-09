import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/colors';
import BackButton from '../../components/BackButton';

const HelpSupportScreen = ({ navigation }) => {

  const handleCall = () => {
    Linking.openURL('tel:9797798505');
  };

  const handleWhatsApp = () => {
    // International format without '+' for deep linking usually works best across devices
    Linking.openURL('whatsapp://send?text=Hello Amigos, I need help.&phone=919797798505');
  };

  const handleWebsite = () => {
    Linking.openURL('https://amigospizza.co/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView>

        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Help & Support</Text>
        </View>

        {/* Main Actions */}
        <View style={styles.actionContainer}>
          <Text style={styles.sectionHeader}>Quick Actions</Text>

          {/* WhatsApp Button */}
          <TouchableOpacity
            style={[styles.option, { backgroundColor: '#F0FDF4', borderColor: '#25D366', borderWidth: 1 }]}
            onPress={handleWhatsApp}
          >
            <Image
              source={require('../../../assets/icons/whatsapp.png')}
              style={[styles.btnIcon, { width: 28, height: 28 }]}
            />
            <Text style={[styles.optionText, { color: '#128C7E' }]}>Chat on WhatsApp</Text>
          </TouchableOpacity>

          {/* Call Button */}
          <TouchableOpacity
            style={[styles.option, { backgroundColor: '#FEF2F2', borderColor: COLORS.primary, borderWidth: 1 }]}
            onPress={handleCall}
          >
            <Image
              source={require('../../../assets/icons/call.png')}
              style={[styles.btnIcon, { tintColor: COLORS.primary, width: 24, height: 24 }]}
            />
            <Text style={[styles.optionText, { color: COLORS.primary }]}>Call Customer Care</Text>
          </TouchableOpacity>
        </View>

        {/* Store Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Store Information</Text>

          <Text style={styles.storeName}>Amigos Food & Hospitalities</Text>
          <Text style={styles.address}>
            Gogji Bagh, Opp. Amar Singh College Main Gate, Srinagar
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>📞 Phones:</Text>
            <Text style={styles.value} onPress={handleCall}>9797798505, 9906667444</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>🕒 Hours:</Text>
            <Text style={styles.value}>Sun - Sat: 10:30 AM to 10 PM</Text>
          </View>

          <TouchableOpacity style={styles.webButton} onPress={handleWebsite}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png' }}
              style={styles.webIcon}
            />
            <Text style={styles.webText}>Visit Website: amigospizza.co</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>© 2024 Amigos Pizza. All rights reserved.</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  header: {
    padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  backIcon: { fontSize: 24, marginRight: 15, color: '#333' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  actionContainer: { padding: 20 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 15 },

  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, marginBottom: 15, borderRadius: 12, elevation: 3
  },
  btnIcon: { width: 24, height: 24, marginRight: 10 },
  optionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  card: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 15,
    padding: 20, elevation: 2, marginBottom: 20
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10, textTransform: 'uppercase' },
  storeName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  address: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 15 },

  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },

  infoRow: { flexDirection: 'row', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', width: 90 },
  value: { fontSize: 14, color: '#333', flex: 1 },

  webButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 10, padding: 12, backgroundColor: '#F0F8FF', borderRadius: 8, borderWidth: 1, borderColor: '#D0E0FF'
  },
  webIcon: { width: 18, height: 18, marginRight: 8, tintColor: COLORS.primary },
  webText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },

  footerText: { textAlign: 'center', color: '#AAA', fontSize: 12, marginBottom: 30 }
});

export default HelpSupportScreen;