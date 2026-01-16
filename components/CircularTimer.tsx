import Colors from '@/constants/colors';
import useTimerStore from '@/store/timerStore';
import { ChevronDown, ChevronUp, Play, SkipForward, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';

const CIRCLE_RADIUS = 150;
const STROKE_WIDTH = 15;
const CIRCUMFERENCE = 2 * Math.PI * (CIRCLE_RADIUS - STROKE_WIDTH / 2);
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

export default function CircularTimer() {
  const {
    sessionStartTimestamp,
    initialTime,
    isActive,
    showTimeAdjust,
    showCancel,
    showSkip,
    startTimer,
    cancelTimer,
    skipTimer,
    toggleTimeAdjust,
    adjustTime,
    getLiveTime,
    userAcceptedRecommendation,
  } = useTimerStore();

  const [, forceRender] = React.useReducer(x => x + 1, 0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    const timerStore = useTimerStore.getState();
    const interval = setInterval(() => {
      timerStore.restoreTimerState();
      forceRender();
    }, 1000);
  
    return () => clearInterval(interval);
  }, []);

  const time = getLiveTime();

  const progress = React.useMemo(() => {
    if (!initialTime || initialTime <= 0) return 0;
    const ratio = 1 - time / initialTime;
    return Math.min(Math.max(ratio, 0), 1);
  }, [time, initialTime]);

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: isFirstRender.current ? 0 : 200,
      useNativeDriver: false,
    }).start(() => {
      isFirstRender.current = false;
    });
  }, [progress]);

  const formatTime = (sec: number) => {
    //coerce badly‐typed or undefined into 0
    const safeSec = Number(sec) || 0;
    const m = Math.floor(safeSec / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(safeSec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };
  

  const handleStartPause = () => {
    startTimer();
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const label = formatTime(time);
  const display = label.includes('NaN') ? '00:00' : label;

  return (
    <View style={styles.timerContainer}>
      <Animated.View
        style={[
          styles.circularProgress,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.circleContainer}>
          <Svg width={CIRCLE_RADIUS * 2} height={CIRCLE_RADIUS * 2}>
            <SvgCircle
              cx={CIRCLE_RADIUS}
              cy={CIRCLE_RADIUS}
              r={CIRCLE_RADIUS - STROKE_WIDTH / 2}
              stroke={Colors.border}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <AnimatedCircle
              cx={CIRCLE_RADIUS}
              cy={CIRCLE_RADIUS}
              r={CIRCLE_RADIUS - STROKE_WIDTH / 2}
              stroke={Colors.primary}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={animatedProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [CIRCUMFERENCE, 0],
              })}
              strokeLinecap="round"
              fill="none"
              rotation="-90"
              originX={CIRCLE_RADIUS}
              originY={CIRCLE_RADIUS}
            />
          </Svg>

          <View style={styles.circleContent}>
            <View style={styles.timeAdjustContainer}>
              {!isActive && showTimeAdjust && (
                <TouchableOpacity
                  onPress={() => adjustTime('up')}
                  style={styles.timeAdjustButton}
                >
                  <ChevronUp size={60} color={Colors.secondary} />
                </TouchableOpacity>
              )}
              {( (!isActive && !userAcceptedRecommendation) || showTimeAdjust ) ? (
                <TouchableOpacity
                  onPress={() => {
                    const store = useTimerStore.getState();

                    if (store.showTimeAdjust) {
                      useTimerStore.setState({ showTimeAdjust: false });
                    } else if (!store.hasInteractedWithTimer && !store.userAcceptedRecommendation && !store.hasDismissedRecommendationCard) {
                      useTimerStore.setState({
                        userAcceptedRecommendation: false,
                        hasInteractedWithTimer: true
                      });
                    }
                  }}
                  style={styles.timeTextContainer}
                >
                  <Text style={styles.timeText}>{display}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.timeTextContainer}>
                  <Text style={styles.timeText}>{display}</Text>
                </View>
              )}

              {!isActive && showTimeAdjust && (
                <TouchableOpacity
                  onPress={() => adjustTime('down')}
                  style={styles.timeAdjustButton}
                >
                  <ChevronDown size={60} color={Colors.secondary} />
                </TouchableOpacity>
              )}
            </View>

            {(!isActive && !showTimeAdjust) ? (
              <TouchableOpacity
                onPress={() => {
                  useTimerStore.getState().setHasInteractedWithTimer(true);
                  handleStartPause();
                }}
                style={styles.startPauseButton}
              >
                <Play size={32} color={Colors.secondary} />
              </TouchableOpacity>
            ) : !isActive && showTimeAdjust ? null : showCancel ? (
              <TouchableOpacity
                onPress={cancelTimer}
                style={[styles.startPauseButton, styles.cancelButton]}
              >
                <X size={32} color={Colors.secondary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={skipTimer}
                style={[styles.startPauseButton, styles.skipButton]}
              >
                <SkipForward size={32} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgress: {
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
    borderRadius: CIRCLE_RADIUS,
    overflow: 'hidden',
  },
  circleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CIRCLE_RADIUS,
  },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 20,
  },
  startPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timeAdjustContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeTextContainer: {
    paddingVertical: 4,
    padding: 10,
    marginVertical: -5,
  },
  timeAdjustButton: {
    padding: 4,
    marginVertical: -10, 
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  skipButton: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});
