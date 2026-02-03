import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { BLEPrinter, NetPrinter } from 'react-native-thermal-receipt-printer';
import { Ionicons } from '@expo/vector-icons';

export default function PrinterScreen() {
  const [printers, setPrinters] = useState([]);
  const [currentPrinter, setCurrentPrinter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState("192.168.1.100");
  const [mode, setMode] = useState('BLE'); // 'BLE' or 'WIFI'

  useEffect(() => {
    // Need to request permissions first in real app
    BLEPrinter.init();
    NetPrinter.init();
  }, []);

  const scanBluetooth = () => {
    setLoading(true);
    BLEPrinter.scan()
      .then(deviceList => {
        setPrinters(deviceList); // Returns array of { inner_mac_address, device_name }
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        Alert.alert("Error", "Bluetooth scan failed");
      });
  };

  const connectBLE = async (printer) => {
    setLoading(true);
    try {
      await BLEPrinter.connectPrinter(printer.inner_mac_address);
      setCurrentPrinter(printer);
      Alert.alert("Connected", `Connected to ${printer.device_name}`);
    } catch (e) {
      Alert.alert("Error", "Connection Failed");
    } finally {
      setLoading(false);
    }
  };

  const connectWiFi = async () => {
    setLoading(true);
    try {
        await NetPrinter.connectPrinter(ipAddress, 9100);
        setCurrentPrinter({ device_name: `WiFi: ${ipAddress}` });
        Alert.alert("Connected", `Connected to ${ipAddress}`);
    } catch(e) {
        Alert.alert("Error", "WiFi Connection Failed");
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={{flex:1, padding:20, backgroundColor:'#F9FAFB'}}>
        <Text style={{fontSize:24, fontWeight:'bold', marginBottom:20}}>Printer Setup</Text>

        {/* TABS */}
        <View style={{flexDirection:'row', marginBottom:20}}>
            <TouchableOpacity 
                onPress={() => setMode('BLE')}
                style={{flex:1, padding:10, backgroundColor: mode==='BLE'?'#D23F45':'#EEE', alignItems:'center', borderRadius:8, marginRight:5}}>
                <Text style={{color: mode==='BLE'?'#FFF':'#333', fontWeight:'bold'}}>Bluetooth</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={() => setMode('WIFI')}
                style={{flex:1, padding:10, backgroundColor: mode==='WIFI'?'#D23F45':'#EEE', alignItems:'center', borderRadius:8, marginLeft:5}}>
                <Text style={{color: mode==='WIFI'?'#FFF':'#333', fontWeight:'bold'}}>WiFi / LAN</Text>
            </TouchableOpacity>
        </View>

        {/* BLUETOOTH VIEW */}
        {mode === 'BLE' && (
            <>
                <TouchableOpacity onPress={scanBluetooth} style={{backgroundColor:'#333', padding:15, borderRadius:8, alignItems:'center', marginBottom:20}}>
                    {loading ? <ActivityIndicator color="#FFF"/> : <Text style={{color:'#FFF', fontWeight:'bold'}}>Scan for Printers</Text>}
                </TouchableOpacity>

                <FlatList
                    data={printers}
                    keyExtractor={item => item.inner_mac_address}
                    renderItem={({item}) => (
                        <TouchableOpacity 
                            onPress={() => connectBLE(item)}
                            style={{padding:15, backgroundColor:'#FFF', marginBottom:10, borderRadius:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                            <View>
                                <Text style={{fontWeight:'bold'}}>{item.device_name || "Unknown Device"}</Text>
                                <Text style={{fontSize:12, color:'#666'}}>{item.inner_mac_address}</Text>
                            </View>
                            {currentPrinter?.inner_mac_address === item.inner_mac_address && (
                                <Ionicons name="checkmark-circle" size={24} color="green" />
                            )}
                        </TouchableOpacity>
                    )}
                />
            </>
        )}

        {/* WIFI VIEW */}
        {mode === 'WIFI' && (
            <View>
                <Text style={{marginBottom:10, fontWeight:'600'}}>Printer IP Address</Text>
                <TextInput 
                    value={ipAddress}
                    onChangeText={setIpAddress}
                    style={{backgroundColor:'#FFF', padding:15, borderRadius:8, borderWidth:1, borderColor:'#DDD', marginBottom:20}}
                    keyboardType="numeric"
                />
                <TouchableOpacity onPress={connectWiFi} style={{backgroundColor:'#333', padding:15, borderRadius:8, alignItems:'center'}}>
                    {loading ? <ActivityIndicator color="#FFF"/> : <Text style={{color:'#FFF', fontWeight:'bold'}}>Connect WiFi Printer</Text>}
                </TouchableOpacity>
            </View>
        )}

        {/* STATUS */}
        <View style={{marginTop:30, padding:15, backgroundColor:'#E0F2FE', borderRadius:8}}>
            <Text style={{color:'#0369A1', fontWeight:'bold'}}>
                Current Status: {currentPrinter ? `Connected to ${currentPrinter.device_name}` : "Not Connected"}
            </Text>
        </View>
    </View>
  );
}