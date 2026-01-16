import Colors from '@/constants/colors';
import useTimerStore from '@/store/timerStore';
import { ThumbsDown, ThumbsUp, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
const safeNum = (x: any): number => {
  const n = Number(x);
  return isNaN(n) ? 0 : n;
};

export default function RecommendationModal() {
  const { 
    recommendedFocusDuration, 
    recommendedBreakDuration,
    userAcceptedRecommendation,
    timeOfDay,
    energyLevel,
    taskType,
    acceptRecommendation,
    rejectRecommendation,
    toggleTimeAdjust,
    setHasDismissedRecommendationCard,
    hasDismissedRecommendationCard
  } = useTimerStore();
  
  const focus = safeNum(recommendedFocusDuration);
  const breakDur = safeNum(recommendedBreakDuration);

  //don't show if user hasn't selected energy level or task type yet
  if (!energyLevel || !taskType) {
    return null;
  }

  //don't show if the recommendation has been handled already
  if (userAcceptedRecommendation || hasDismissedRecommendationCard) {
    return null;
  }

  const formatTimeOfDay = (tod: string): string => {
    return tod.charAt(0).toUpperCase() + tod.slice(1);
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <Zap size={20} color={Colors.primary} />
          <Text style={styles.title}>Smart Recommendation</Text>
        </View>
        
        <Text style={styles.description}>
          Based on your <Text style={styles.highlight}>{taskType}</Text> task, 
          <Text style={styles.highlight}> {energyLevel} energy</Text> and 
          the <Text style={styles.highlight}> {formatTimeOfDay(timeOfDay)}</Text> time:
        </Text>
        
        <View style={styles.recommendationRow}>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationLabel}>Focus</Text>
            <Text style={styles.recommendationValue}>{focus} min</Text>
          </View>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationLabel}>Break</Text>
            <Text style={styles.recommendationValue}>{breakDur} min</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => {
              rejectRecommendation();
              setHasDismissedRecommendationCard(true);
              useTimerStore.setState({ showTimeAdjust: true });
            }}
          >
            <ThumbsDown size={16} color={Colors.text.secondary} />
            <Text style={styles.rejectButtonText}>Customise</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => {
              acceptRecommendation();
              setHasDismissedRecommendationCard(true);
              useTimerStore.setState({ showTimeAdjust: false });
            }}
          >
            <ThumbsUp size={16} color={Colors.card} />
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  highlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  recommendationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  recommendationItem: {
    alignItems: 'center',
  },
  recommendationLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  recommendationValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    marginLeft: 10,
  },
  rejectButton: {
    backgroundColor: Colors.background,
    marginRight: 10,
  },
  acceptButtonText: {
    color: Colors.card,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 15,
  },
  rejectButtonText: {
    color: Colors.text.secondary,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 15,
  },
});
