import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, useAppColors, type AppColors } from '../theme';
import { ScreenContainer } from './screen-container';

type PlaceholderScreenProps = {
  title: string;
  subtitle?: string;
};

/** Temporary themed screen used by feature placeholders until real UI lands. */
export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps) {
  const colors = useAppColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.caption}>{subtitle}</Text> : null}
      </View>
    </ScreenContainer>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    body: {
      flex: 1,
      padding: spacing.lg,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '700',
    },
    caption: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: spacing.sm,
    },
  });
}
