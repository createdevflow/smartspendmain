// components/RazorpayCheckout.js
import React, { useState } from 'react';
import { View, ActivityIndicator, Modal, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

export default function RazorpayCheckout({
  visible,
  onClose,
  options,
  onSuccess,
  onCancel,
  onError,
}) {
  const [loading, setLoading] = useState(true);

  if (!visible || !options) return null;

  // HTML content that integrates Razorpay checkout
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Razorpay Checkout</title>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <style>
        body { 
          display: flex; justify-content: center; align-items: center; 
          height: 100vh; background-color: #f3f4f6; margin: 0; font-family: sans-serif;
        }
        .loader {
          border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; 
          border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="loader" id="loader"></div>
      
      <script>
        window.onload = function() {
          try {
            var options = ${JSON.stringify(options)};
            
            options.handler = function(response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', data: response }));
            };
            
            options.modal = {
              ondismiss: function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'cancel' }));
              }
            };
            
            var rzp = new Razorpay(options);
            
            rzp.on('payment.failed', function(response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'error', data: response.error }));
            });
            
            document.getElementById('loader').style.display = 'none';
            rzp.open();
          } catch(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'init_error', data: e.message }));
          }
        };
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.event === 'success') {
        if (onSuccess) onSuccess(msg.data);
      } else if (msg.event === 'cancel') {
        if (onCancel) onCancel();
      } else if (msg.event === 'error') {
        if (onError) onError(msg.data);
      } else if (msg.event === 'init_error') {
        console.error('Razorpay Init Error:', msg.data);
        if (onError) onError(msg.data);
      }
    } catch (e) {
      console.error('Webview Message Parse Error:', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Secure Checkout</Text>
          <View style={{ width: 60 }} />
        </View>
        
        <View style={styles.content}>
          {loading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          )}
          
          <WebView
            source={{ html: htmlContent }}
            onMessage={handleMessage}
            onLoad={() => setLoading(false)}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            bounces={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  closeBtn: {
    padding: 8,
    width: 60,
  },
  closeText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  webview: {
    flex: 1,
  },
});
