import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const BackButton = ({ onPress, style, color }) => {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            navigation.goBack();
        }
    };

    return (
        <TouchableOpacity onPress={handlePress} style={[styles.container, style]}>
            <Image
                source={require('../../assets/icons/back.png')}
                style={[
                    styles.icon,
                    { tintColor: color || (isDark ? '#fff' : '#000') }
                ]}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        marginLeft: -8, // Hit slop adjustment
    },
    icon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
});

export default BackButton;
