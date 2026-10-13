import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DonutChart } from '../components/DonutChart';
import { ProfileBadge } from '../components/ProfileBadge';
import { SegmentedControl } from '../components/SegmentedControl';
import { useTodaySteps } from '../hooks/useTodaySteps';
import { loadProfile } from '../storage/profileStorage';
import { colors, spacing } from '../theme';
import type { Profile } from '../types';

const formatSteps = new Intl.NumberFormat('en-US');

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const { steps, status } = useTodaySteps();

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
  const progress = goal > 0 ? steps / goal : 0;
  const goalReached = progress >= 1;

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
          <Text style={styles.todayLabel}>Today</Text>
          <Text style={styles.stepsValue}>{formatSteps.format(steps)}</Text>
          <Text style={styles.goalLabel}>of {formatSteps.format(goal)} steps</Text>
          {goalReached && <Text style={styles.goalReached}>✓ Goal reached</Text>}
        </View>
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
  footerText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
