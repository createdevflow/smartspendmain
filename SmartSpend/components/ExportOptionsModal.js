import React, { useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform, Modal, Pressable } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const ExportOptionsModal = forwardRef(({ onExport }, ref) => {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = React.useRef(null);
  
  const [filterType, setFilterType] = useState('all'); // 'all', 'in', 'out'
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' or 'csv'
  
  useImperativeHandle(ref, () => ({
    present: () => {
      // Reset state on open
      setFilterType('all');
      setStartDate(null);
      setEndDate(null);
      setExportFormat('pdf');
      bottomSheetRef.current?.present();
    },
    dismiss: () => {
      bottomSheetRef.current?.dismiss();
    }
  }));

  const snapPoints = useMemo(() => ['70%'], []);

  const openDatePicker = (field) => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!selectedDate) return;
    
    if (dateField === 'start') setStartDate(selectedDate);
    if (dateField === 'end') setEndDate(selectedDate);
  };

  const handleExport = () => {
    onExport({
      type: filterType,
      startDate,
      endDate,
      format: exportFormat
    });
    bottomSheetRef.current?.dismiss();
  };

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
        )}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.title}>Export Options</Text>
          <Text style={styles.subtitle}>Customize what transactions to export</Text>

          {/* Format Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Format</Text>
            <View style={styles.rowBtnGroup}>
              <TouchableOpacity
                style={[styles.rowBtn, exportFormat === 'pdf' && styles.rowBtnActive]}
                onPress={() => setExportFormat('pdf')}
              >
                <Feather name="file" size={16} color={exportFormat === 'pdf' ? '#1D4ED8' : '#6B7280'} />
                <Text style={[styles.rowBtnText, exportFormat === 'pdf' && styles.rowBtnTextActive]}>PDF Document</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rowBtn, exportFormat === 'csv' && styles.rowBtnActive]}
                onPress={() => setExportFormat('csv')}
              >
                <Feather name="file-text" size={16} color={exportFormat === 'csv' ? '#1D4ED8' : '#6B7280'} />
                <Text style={[styles.rowBtnText, exportFormat === 'csv' && styles.rowBtnTextActive]}>CSV Spreadsheet</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Transaction Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Type</Text>
            <View style={styles.rowBtnGroup}>
              <TouchableOpacity
                style={[styles.rowBtn, filterType === 'all' && styles.rowBtnActive]}
                onPress={() => setFilterType('all')}
              >
                <Text style={[styles.rowBtnText, filterType === 'all' && styles.rowBtnTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rowBtn, filterType === 'in' && styles.rowBtnActive, { borderColor: filterType === 'in' ? '#16A34A' : '#E5E7EB', backgroundColor: filterType === 'in' ? '#DCFCE7' : '#fff' }]}
                onPress={() => setFilterType('in')}
              >
                <Text style={[styles.rowBtnText, filterType === 'in' && { color: '#16A34A' }]}>Income Only</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rowBtn, filterType === 'out' && styles.rowBtnActive, { borderColor: filterType === 'out' ? '#DC2626' : '#E5E7EB', backgroundColor: filterType === 'out' ? '#FEE2E2' : '#fff' }]}
                onPress={() => setFilterType('out')}
              >
                <Text style={[styles.rowBtnText, filterType === 'out' && { color: '#DC2626' }]}>Expense Only</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <View style={styles.datePickerRow}>
              <TouchableOpacity style={styles.dateBtn} onPress={() => openDatePicker('start')}>
                <Feather name="calendar" size={16} color="#6B7280" />
                <Text style={[styles.dateBtnText, startDate && { color: '#111827' }]}>
                  {startDate ? startDate.toLocaleDateString('en-IN') : 'Start Date'}
                </Text>
              </TouchableOpacity>
              <Text style={{ marginHorizontal: 8, color: '#9CA3AF' }}>to</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => openDatePicker('end')}>
                <Feather name="calendar" size={16} color="#6B7280" />
                <Text style={[styles.dateBtnText, endDate && { color: '#111827' }]}>
                  {endDate ? endDate.toLocaleDateString('en-IN') : 'End Date'}
                </Text>
              </TouchableOpacity>
            </View>
            {(startDate || endDate) && (
              <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => { setStartDate(null); setEndDate(null); }}>
                <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '500' }}>Clear Dates</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
              <Feather name="download" size={18} color="#fff" />
              <Text style={styles.exportBtnText}>Generate {exportFormat.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {showDatePicker && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade" visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)} />
          <View style={styles.datePickerModalOverlay}>
            <View style={styles.datePickerModalContainer}>
              <View style={styles.datePickerModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: 'center', paddingBottom: 24, paddingTop: 8 }}>
                <DateTimePicker
                  value={(dateField === 'start' ? startDate : endDate) || new Date()}
                  mode="date"
                  display="inline"
                  onChange={onDateChange}
                  style={{ width: 320, height: 330 }}
                  textColor="#000000"
                  themeVariant="light"
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : showDatePicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={(dateField === 'start' ? startDate : endDate) || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      ) : null}
    </>
  );
});

export default ExportOptionsModal;

const styles = StyleSheet.create({
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  rowBtnGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', gap: 6 },
  rowBtnActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  rowBtnText: { fontSize: 14, fontWeight: '500', color: '#4B5563' },
  rowBtnTextActive: { color: '#1D4ED8', fontWeight: '600' },
  datePickerRow: { flexDirection: 'row', alignItems: 'center' },
  dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, gap: 8 },
  dateBtnText: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  actionRow: { marginTop: 10 },
  exportBtn: { backgroundColor: '#2D8CFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8 },
  exportBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  datePickerModalOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 20 },
  datePickerModalContainer: { width: '100%' },
  datePickerModalHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  datePickerDoneText: { color: '#2563eb', fontWeight: 'bold', fontSize: 16 },
});
