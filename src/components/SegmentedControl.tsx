import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';

const SEGMENTS = ['D', 'W', 'M'] as const;

/**
 * Visual only for now — the day/week/month views are not implemented yet.
 */
export function SegmentedControl() {
  const [active, setActive] = useState<(typeof SEGMENTS)[number]>('D');

  return (
    <View style={styles.container}>
      {SEGMENTS.map((segment) => {
        const isActive = segment === active;
        return (
          <Pressable
            key={segment}
            onPress={() => setActive(segment)}
            style={[styles.segment, isActive && styles.segmentActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{segment}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
  },
  segment: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: colors.surfaceLight,
  },
  label: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.text,
  },
});
