import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoalPicker } from '../components/GoalPicker';
import { estimateDailyGoal } from '../services/goalEstimator';
import { saveProfile } from '../storage/profileStorage';
import { colors, radius, spacing } from '../theme';

interface FormState {
  name: string;
  birthDate: Date | null;
  heightCm: string;
  weightKg: string;
}

type Errors = Partial<Record<keyof FormState | 'goal', string>>;

const formatDate = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const parseDateInputValue = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// @react-native-community/datetimepicker has no web implementation (ios/android
// only), so on web we render a native HTML date input inside the same modal.
let WebDateInput: React.ComponentType<{
  value: string;
  max: string;
  onChange: (value: string) => void;
}> | null = null;

if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- conditional web-only import; a static import would pull react-native-web into native bundles
  const { unstable_createElement } = require('react-native-web');
  WebDateInput = ({ value, max, onChange }) =>
    unstable_createElement('input', {
      type: 'date',
      value,
      max,
      onChange: (event: { target: { value: string } }) =>
        onChange(event.target.value),
      style: {
        color: colors.text,
        backgroundColor: colors.surfaceLight,
        fontSize: 16,
        padding: 12,
        borderRadius: radius.md,
        border: `1px solid ${colors.border}`,
      },
    });
}

function validate(form: FormState, goal: number): Errors {
  const errors: Errors = {};

  if (form.name.trim().length === 0) errors.name = 'Please enter your name.';

  if (!form.birthDate) {
    errors.birthDate = 'Please enter your date of birth.';
  } else if (form.birthDate.getTime() > Date.now()) {
    errors.birthDate = 'Date of birth must be in the past.';
  }

  const height = parseFloat(form.heightCm);
  if (form.heightCm.trim().length === 0 || Number.isNaN(height)) {
    errors.heightCm = 'Please enter your height.';
  } else if (height < 100 || height > 250) {
    errors.heightCm = 'Height must be between 100 and 250 cm.';
  }

  const weight = parseFloat(form.weightKg);
  if (form.weightKg.trim().length === 0 || Number.isNaN(weight)) {
    errors.weightKg = 'Please enter your weight.';
  } else if (weight < 20 || weight > 300) {
    errors.weightKg = 'Weight must be between 20 and 300 kg.';
  }

  if (!Number.isInteger(goal) || goal < 1000 || goal > 50000) {
    errors.goal = 'Goal must be between 1,000 and 50,000 steps.';
  }

  return errors;
}

export default function OnboardingScreen() {
  const [form, setForm] = useState<FormState>({
    name: '',
    birthDate: null,
    heightCm: '',
    weightKg: '',
  });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerValue, setPickerValue] = useState<Date>(new Date(1990, 0, 1));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const suggestedGoal = useMemo(() => {
    const height = parseFloat(form.heightCm);
    const weight = parseFloat(form.weightKg);
    if (form.birthDate && !Number.isNaN(height) && !Number.isNaN(weight)) {
      return estimateDailyGoal({
        birthDate: form.birthDate.toISOString(),
        heightCm: height,
        weightKg: weight,
      });
    }
    return null;
  }, [form.birthDate, form.heightCm, form.weightKg]);

  const [goal, setGoal] = useState(8000);
  const [goalTouched, setGoalTouched] = useState(false);

  // Follow the suggestion until the user picks a goal themselves; from then
  // on their choice wins, even if the suggestion changes afterwards.
  const effectiveGoal = goalTouched ? goal : (suggestedGoal ?? goal);

  const handleGoalChange = (value: number) => {
    setGoalTouched(true);
    setGoal(value);
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const openPicker = () => {
    setPickerValue(form.birthDate ?? new Date(1990, 0, 1));
    setPickerVisible(true);
  };

  const confirmPicker = () => {
    update('birthDate', pickerValue);
    setPickerVisible(false);
  };

  const submit = async () => {
    const nextErrors = validate(form, effectiveGoal);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await saveProfile({
        name: form.name.trim(),
        birthDate: (form.birthDate as Date).toISOString(),
        heightCm: parseFloat(form.heightCm),
        weightKg: parseFloat(form.weightKg),
        dailyGoal: effectiveGoal,
      });
      router.replace('/home');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Create your profile</Text>
          <Text style={styles.subtitle}>
            We use this to suggest a healthy daily step goal. Everything stays on
            your device.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(text) => update('name', text)}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.error}>{errors.name}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date of birth</Text>
            <Pressable style={styles.input} onPress={openPicker}>
              <Text
                style={form.birthDate ? styles.inputText : styles.inputPlaceholder}
              >
                {form.birthDate
                  ? formatDate.format(form.birthDate)
                  : 'Select your date of birth'}
              </Text>
            </Pressable>
            {errors.birthDate && <Text style={styles.error}>{errors.birthDate}</Text>}
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.rowField]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={form.heightCm}
                onChangeText={(text) => update('heightCm', text)}
                placeholder="170"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              {errors.heightCm && (
                <Text style={styles.error}>{errors.heightCm}</Text>
              )}
            </View>
            <View style={[styles.field, styles.rowField]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={form.weightKg}
                onChangeText={(text) => update('weightKg', text)}
                placeholder="65"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              {errors.weightKg && (
                <Text style={styles.error}>{errors.weightKg}</Text>
              )}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Daily step goal</Text>
            <GoalPicker
              value={effectiveGoal}
              onChange={handleGoalChange}
              suggested={suggestedGoal}
            />
            {errors.goal && <Text style={styles.error}>{errors.goal}</Text>}
          </View>

          <Pressable
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={submit}
            disabled={saving}
          >
            <Text style={styles.buttonLabel}>
              {saving ? 'Saving…' : 'Start walking'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {Platform.OS === 'web' && WebDateInput ? (
              <WebDateInput
                value={toDateInputValue(pickerValue)}
                max={toDateInputValue(new Date())}
                onChange={(value) => {
                  if (value) setPickerValue(parseDateInputValue(value));
                }}
              />
            ) : (
              <DateTimePicker
                value={pickerValue}
                onChange={(_event, date) => {
                  if (date) setPickerValue(date);
                }}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
              />
            )}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButton}
                onPress={() => setPickerVisible(false)}
              >
                <Text style={styles.modalButtonLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={confirmPicker}>
                <Text style={[styles.modalButtonLabel, styles.modalButtonPrimary]}>
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 21,
  },
  field: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  rowField: { flex: 1 },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    justifyContent: 'center',
    color: colors.text,
  },
  inputText: { color: colors.text, fontSize: 16 },
  inputPlaceholder: { color: colors.textMuted, fontSize: 16 },
  error: { color: colors.danger, fontSize: 13, marginTop: 6 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonLabel: { color: '#06222F', fontSize: 16, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  modalButton: { padding: spacing.sm },
  modalButtonLabel: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  modalButtonPrimary: { color: colors.accent },
});
