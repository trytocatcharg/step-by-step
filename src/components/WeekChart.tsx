import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import type { DaySteps } from '../services/steps';
import { colors, radius } from '../theme';

interface WeekChartProps {
  /** Exactly 7 entries, oldest first. */
  days: DaySteps[];
  /** Daily step goal; drawn as the dotted reference line. */
  goal: number;
  /** Index of the selected day (0 = oldest), or null for no selection. */
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

const CHART_HEIGHT = 130;
const PAD_TOP = 26;
const PAD_BOTTOM = 6;
const PAD_X = 14;
const TOOLTIP_HEIGHT = 26;
const TOOLTIP_GAP = 8;
const HIT_RADIUS = 22;

const formatSteps = new Intl.NumberFormat('en-US');

interface Point {
  x: number;
  y: number;
}

/** Catmull-Rom spline through the points as a cubic bezier path. */
function smoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length < 2) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function weekdayLabel(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
  });
}

export function WeekChart({
  days,
  goal,
  selectedIndex,
  onSelect,
}: WeekChartProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(Math.round(event.nativeEvent.layout.width));
  };

  const labels = days.map((d) => weekdayLabel(d.date).toUpperCase());
  const maxSteps = Math.max(...days.map((d) => d.steps), goal);
  const chartMax = maxSteps * 1.15 || 1;

  const chartW = Math.max(width - PAD_X * 2, 0);
  const yFor = (steps: number) =>
    PAD_TOP +
    (CHART_HEIGHT - PAD_TOP - PAD_BOTTOM) * (1 - Math.min(steps / chartMax, 1));

  const points: Point[] = days.map((d, i) => ({
    x: PAD_X + (days.length === 1 ? chartW / 2 : (chartW * i) / (days.length - 1)),
    y: yFor(d.steps),
  }));

  const linePath = smoothPath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`
      : '';
  const goalY = goal > 0 ? yFor(goal) : null;

  const selected =
    selectedIndex !== null &&
    selectedIndex >= 0 &&
    selectedIndex < points.length
      ? points[selectedIndex]
      : undefined;
  const selectedSteps =
    selectedIndex !== null ? (days[selectedIndex]?.steps ?? 0) : 0;
  const tooltipText = `${formatSteps.format(selectedSteps)} steps`;
  const tooltipWidth = tooltipText.length * 6.8 + 16;
  const tooltipX = selected
    ? Math.min(
        Math.max(selected.x, PAD_X + tooltipWidth / 2),
        width - PAD_X - tooltipWidth / 2
      ) - tooltipWidth / 2
    : 0;
  const tooltipY = selected
    ? Math.max(selected.y - TOOLTIP_GAP - TOOLTIP_HEIGHT, 0)
    : 0;

  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.labels}>
        {labels.map((label, i) => (
          <Text
            key={`${label}-${i}`}
            style={[
              styles.label,
              i === labels.length - 1 && styles.labelToday,
              i === selectedIndex && styles.labelSelected,
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
      {width > 0 && (
        <Svg width={width} height={CHART_HEIGHT}>
          {/* Tapping the plot area outside a day dot clears the selection. */}
          <Rect
            x={0}
            y={0}
            width={width}
            height={CHART_HEIGHT}
            fill="transparent"
            onPress={() => onSelect(null)}
          />
          <Defs>
            <LinearGradient id="weekFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent} stopOpacity="0.35" />
              <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {goalY !== null && (
            <Line
              x1={PAD_X}
              y1={goalY}
              x2={width - PAD_X}
              y2={goalY}
              stroke={colors.textMuted}
              strokeWidth={1.5}
              strokeDasharray="2 6"
              strokeLinecap="round"
              opacity={0.7}
            />
          )}
          {areaPath !== '' && <Path d={areaPath} fill="url(#weekFill)" />}
          {linePath !== '' && (
            <Path
              d={linePath}
              fill="none"
              stroke={colors.accent}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          )}
          {selected && (
            <G>
              <Circle
                cx={selected.x}
                cy={selected.y}
                r={8}
                fill="none"
                stroke={colors.accent}
                strokeWidth={2}
              />
            </G>
          )}
          {points.map((p, i) => (
            <G key={i} onPress={() => onSelect(i)}>
              {/* Generous invisible hit area around each dot. */}
              <Circle cx={p.x} cy={p.y} r={HIT_RADIUS} fill="transparent" />
              <Circle
                cx={p.x}
                cy={p.y}
                r={i === selectedIndex ? 5 : 3.5}
                fill={colors.text}
              />
            </G>
          ))}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  labelToday: {
    color: colors.text,
  },
  labelSelected: {
    color: colors.accent,
  },
});
