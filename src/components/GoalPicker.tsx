import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius } from '../theme';

const PRESETS = [6000, 8000, 10000];

const format = new Intl.NumberFormat('en-US');

interface GoalPickerProps {
  value: number;
  onChange: (value: number) => void;
  suggested: number | null;
}

export function GoalPicker({ value, onChange, suggested }: GoalPickerProps) {
  const [customText, setCustomText] = useState(
    PRESETS.includes(value) ? '' : String(value)
  );
  const customActive = !PRESETS.includes(value);

  const selectPreset = (preset: number) => {
    onChange(preset);
    setCustomText('');
  };

  const selectCustom = () => {
    const parsed = parseInt(customText, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    } else {
      onChange(8000);
      setCustomText('8000');
    }
  };

  return (
    <View>
      {suggested !== null && (
        <Text style={styles.suggested}>
          Suggested for you based on your profile: {format.format(suggested)} steps
        </Text>
      )}
      <View style={styles.chips}>
        {PRESETS.map((preset) => {
          const isActive = value === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => selectPreset(preset)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {format.format(preset)}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={selectCustom}
          style={[styles.chip, customActive && styles.chipActive]}
        >
          <Text style={[styles.chipLabel, customActive && styles.chipLabelActive]}>
            Custom
          </Text>
        </Pressable>
      </View>
      {customActive && (
        <TextInput
          style={styles.customInput}
          value={customText}
          onChangeText={(text) => {
            const digits = text.replace(/[^0-9]/g, '');
            setCustomText(digits);
            const parsed = parseInt(digits, 10);
            if (!Number.isNaN(parsed) && parsed > 0) onChange(parsed);
          }}
          placeholder="e.g. 7500"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          returnKeyType="done"
          onBlur={selectCustom}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  suggested: {
    color: colors.accent,
    fontSize: 14,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accentDeep,
    borderColor: colors.accentDeep,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.text,
  },
  customInput: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
});
