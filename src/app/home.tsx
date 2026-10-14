import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DonutChart } from '../components/DonutChart';
import { ProfileBadge } from '../components/ProfileBadge';
import { SegmentedControl } from '../components/SegmentedControl';
import { WeekChart } from '../components/WeekChart';
import { useTodaySteps } from '../hooks/useTodaySteps';
import { useWeekSteps } from '../hooks/useWeekSteps';
import { loadProfile } from '../storage/profileStorage';
import { colors, spacing } from '../theme';
import type { Profile } from '../types';

const formatSteps = new Intl.NumberFormat('en-US');

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const { steps, status } = useTodaySteps();
  const { days: weekDays } = useWeekSteps();
  const [selectedDayIndex, setSelectedDayIndex] = useState(6);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  if (profile === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (profile === null) {
    return <Redirect href="/onboarding" />;
  }

  const goal = profile.dailyGoal;
  // The donut mirrors the selected chart day; only "today" is live.
  const isTodaySelected = selectedDayIndex >= weekDays.length - 1;
  const selectedDay = weekDays[selectedDayIndex];
  const displaySteps = isTodaySelected ? steps : (selectedDay?.steps ?? 0);
  const dayLabel = isTodaySelected
    ? 'Today'
    : selectedDay
      ? new Date(`${selectedDay.date}T12:00:00`).toLocaleDateString('en-US', {
          weekday: 'long',
        })
      : 'Today';
  const progress = goal > 0 ? displaySteps / goal : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <ProfileBadge name={profile.name} />
        <SegmentedControl />
        {/* Spacer to keep the segmented control centered (the mockup's
            three-dot menu is intentionally not implemented). */}
        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.donutWrap}>
        <DonutChart progress={progress} />
        <View style={styles.donutCenter} pointerEvents="none">
          <Text style={styles.todayLabel}>{dayLabel}</Text>
          <Text style={styles.stepsValue}>{formatSteps.format(displaySteps)}</Text>
          <Text style={styles.goalLabel}>of {formatSteps.format(goal)} steps</Text>
          {progress >= 1 && <Text style={styles.goalReached}>✓ Goal reached</Text>}
        </View>
      </View>

      <View style={styles.weekChart}>
        <WeekChart
          days={weekDays}
          goal={goal}
          selectedIndex={selectedDayIndex}
          onSelect={setSelectedDayIndex}
        />
      </View>

      <View style={styles.footer}>
        {status === 'unavailable' && (
          <Text style={styles.footerText}>
            Health Connect is not available on this device, so steps cannot be
            counted.
          </Text>
        )}
        {status === 'denied' && (
          <Text style={styles.footerText}>
            Step data permission was denied. You can grant it from Health
            Connect settings.
          </Text>
        )}
        {status === 'error' && (
          <Text style={styles.footerText}>
            Something went wrong while reading your steps. Please try again.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  topBarSpacer: { width: 44 },
  donutWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayLabel: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  stepsValue: {
    color: colors.text,
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -1,
  },
  goalLabel: {
    color: colors.textMuted,
    fontSize: 18,
    marginTop: spacing.xs,
  },
  goalReached: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  footer: {
    minHeight: 48,
    justifyContent: 'center',
    paddingBottom: spacing.md,
  },
  weekChart: {
    marginBottom: spacing.md,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
