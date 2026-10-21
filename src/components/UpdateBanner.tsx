import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

/**
 * Shows an in-app banner when a new JS update is available on EAS Update.
 * The download and reload only work in release builds; in Expo Go or a
 * development client the checks fail silently and the banner never appears.
 */
export function UpdateBanner() {
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    // Manual check on mount; the app config disables the automatic one.
    Updates.checkForUpdateAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  if (!isUpdateAvailable) return null;

  const downloadAndApply = async () => {
    setIsFetching(true);
    try {
      await Updates.fetchUpdateAsync();
    } catch {
      setIsFetching(false);
    }
  };

  return (
    <View style={styles.banner}>
      <Text style={styles.message}>A new version is available</Text>
      <Pressable
        accessibilityRole="button"
        disabled={isFetching}
        onPress={downloadAndApply}
      >
        <Text style={styles.action}>
          {isFetching ? 'Downloading…' : 'Update now'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  message: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  action: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
