import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/colors';
import BackButton from '../../components/BackButton';

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>1. Data Collection</Text>
        <Text style={styles.text}>
          We collect your name, phone number, and address solely for the purpose of delivering your orders accurately.
        </Text>

        <Text style={styles.heading}>2. Location Data</Text>
        <Text style={styles.text}>
          Your location data is used to pinpoint your delivery address on the map to ensure our riders reach you on time.
        </Text>

        <Text style={styles.heading}>3. Sharing of Information</Text>
        <Text style={styles.text}>
          We do not sell your data to third parties. Your phone number is only shared with the delivery partner assigned to your order.
        </Text>

        <Text style={styles.footer}>Last updated: Dec 2025</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backIcon: { fontSize: 24, marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  heading: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: COLORS.dark },
  text: { fontSize: 14, color: '#555', lineHeight: 22 },
  footer: { marginTop: 40, textAlign: 'center', color: '#999', fontSize: 12 }
});

export default PrivacyPolicyScreen;