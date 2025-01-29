import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  PermissionsAndroid, Platform
} from 'react-native';
import { NativeModules } from 'react-native';

const { ZSDKModule } = NativeModules;

const PrinterScreen = () => {
  const [macAddress, setMacAddress] = useState('');
  const [zplText, setZplText] = useState('^XA^FO50,50^A0N,50,50^FDHello World^FS^XZ');
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);



async function requestBluetoothPermissions() {
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);

      if (
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log("Bluetooth permissions granted.");
      } else {
        console.log("Bluetooth permissions denied.");
      }
    } catch (err) {
      console.warn(err);
    }
  }
}


useEffect(() => {
  requestBluetoothPermissions();
}, []);


  // Discover Printers
  const discoverPrinters = () => {
    setLoading(true);
    ZSDKModule.zsdkPrinterDiscoveryBluetooth((error, result) => {
      setLoading(false);
      if (error) {
        Alert.alert('Error', `Printer Discovery Failed: ${error}`);
      } else {
        const discoveredPrinters = JSON.parse(result);
        setPrinters(discoveredPrinters);
        Alert.alert('Success', `Found ${discoveredPrinters.length} printer(s)`);
      }
    });
  };

  // Send Print Job
  const sendPrintJob = () => {
    if (!macAddress) {
      Alert.alert('Error', 'Please enter a MAC address.');
      return;
    }
    ZSDKModule.zsdkWriteBluetooth(macAddress, zplText);
    Alert.alert('Success', 'Print job sent.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Printer Management</Text>

      {/* MAC Address Input */}
      <Text style={styles.label}>Printer MAC Address:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter MAC Address"
        value={macAddress}
        onChangeText={setMacAddress}
      />

      {/* ZPL Text Input */}
      <Text style={styles.label}>ZPL Data:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter ZPL"
        value={zplText}
        onChangeText={setZplText}
        multiline
      />

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={discoverPrinters}>
          <Text style={styles.buttonText}>
            {loading ? 'Discovering...' : 'Discover Printers'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={sendPrintJob}>
          <Text style={styles.buttonText}>Send Print Job</Text>
        </TouchableOpacity>
      </View>

      {/* Printer List */}
      <Text style={styles.label}>Discovered Printers:</Text>
      <FlatList
        data={printers}
        keyExtractor={(item, index) => `${item.address}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.printerItem}>
            <Text style={styles.printerText}>{item.friendlyName}</Text>
            <Text style={styles.printerSubText}>{item.address}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No printers discovered yet.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    height: "100%",
    backgroundColor:"white",
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'red',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  secondaryButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  printerItem: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  printerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  printerSubText: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
});

export default PrinterScreen;
