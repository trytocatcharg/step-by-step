import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

interface ProfileBadgeProps {
  name: string;
  size?: number;
}

export function ProfileBadge({ name, size = 44 }: ProfileBadgeProps) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.text,
    fontWeight: '700',
  },
});
