import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useOnboarding } from '../../context/OnboardingContext';
import * as Progress from 'react-native-progress';
import { useNavigation } from '@react-navigation/native';
import { TourStep } from './TourGuide';

const { width } = Dimensions.get('window');

const CHECKLIST_ITEMS = [
  { id: 'profile', title: 'Complete Profile', desc: 'Add your name and photo', action: 'Profile', icon: 'user' },
  { id: 'firstCashbook', title: 'Create Cashbook', desc: 'Organize your finances', action: 'Books', icon: 'book' },
  { id: 'firstTransaction', title: 'Add Transaction', desc: 'Record your first entry', action: null, icon: 'plus-circle' },
  { id: 'firstGoal', title: 'Set Budget', desc: 'Control your spending', action: null, icon: 'target' },
];

export default function GettingStartedChecklist() {
  const { checklist, isChecklistComplete, updateChecklist } = useOnboarding();
  const navigation = useNavigation();

  const completedCount = CHECKLIST_ITEMS.filter(item => checklist[item.id]).length;
  const isAllComplete = completedCount === CHECKLIST_ITEMS.length;

  if (isChecklistComplete || isAllComplete) return null;

  const progress = completedCount / CHECKLIST_ITEMS.length;

  return (
    <TourStep id="checklist">
      <Animated.View entering={FadeInUp.delay(500)} layout={Layout.springify()} style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Getting Started</Text>
            <Text style={styles.subtitle}>{completedCount} of {CHECKLIST_ITEMS.length} completed</Text>
          </View>
          <Progress.Circle 
            size={48} 
            progress={progress} 
            showsText 
            formatText={() => `${Math.round(progress * 100)}%`}
            textStyle={{ fontSize: 12, fontWeight: '700', color: '#2D8CFF' }}
            color="#2D8CFF" 
            unfilledColor="#EFF6FF"
            borderWidth={0}
            thickness={4}
          />
        </View>

        <View style={styles.list}>
          {CHECKLIST_ITEMS.map((item, index) => {
            const isDone = checklist[item.id];
            return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.item, index === CHECKLIST_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => {
                  if (!isDone) {
                    if (item.action) navigation.navigate(item.action);
                    // the transaction and budget logic are handled from the respective FABs or Modals
                  }
                }}
                activeOpacity={isDone ? 1 : 0.7}
              >
                <View style={[styles.iconWrapper, isDone && styles.iconDone]}>
                  <Feather name={isDone ? "check" : item.icon} size={16} color={isDone ? "#16A34A" : "#9CA3AF"} />
                </View>
                <View style={styles.itemText}>
                  <Text style={[styles.itemTitle, isDone && { color: '#9CA3AF', textDecorationLine: 'line-through' }]}>{item.title}</Text>
                  {!isDone && <Text style={styles.itemDesc}>{item.desc}</Text>}
                </View>
                {!isDone && <Feather name="chevron-right" size={16} color="#D1D5DB" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </TourStep>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#232333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#747487',
    fontWeight: '500',
  },
  list: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#232333',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 13,
    color: '#747487',
  }
});
