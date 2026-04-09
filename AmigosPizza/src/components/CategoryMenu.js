import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';

// Local mapping for icons since your DB might not store URLs for icons
const ICON_MAP = {
  'Pizza': 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png',
  'Burgers': 'https://cdn-icons-png.flaticon.com/512/706/706918.png',
  'Sides': 'https://cdn-icons-png.flaticon.com/512/2515/2515183.png',
  'Drinks': 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png',
  'Desserts': 'https://cdn-icons-png.flaticon.com/512/938/938063.png',
};

const CategoryMenu = ({ categories, onCategoryPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>What's on your mind?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {categories.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.catItem}
            onPress={() => onCategoryPress(item.category_name)}
          >
            <View style={styles.circle}>
              <Image 
                source={{ uri: ICON_MAP[item.category_name] || 'https://cdn-icons-png.flaticon.com/512/1046/1046771.png' }} 
                style={styles.image} 
              />
            </View>
            <Text style={styles.name}>{item.category_name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 15, color: '#222' },
  scrollContent: { paddingLeft: 20, paddingRight: 10 },
  catItem: { alignItems: 'center', marginRight: 20 },
  circle: {
    width: 75, height: 75, borderRadius: 37.5,
    backgroundColor: '#F9F9F9', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#F0F0F0', elevation: 2
  },
  image: { width: 45, height: 45, resizeMode: 'contain' },
  name: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#444' },
});

export default CategoryMenu;