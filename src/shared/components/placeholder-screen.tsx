import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAppColors, type ModeColors } from '../theme';
import { Column } from './layout';
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
      <Column padding="300" gap="100" style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.caption}>{subtitle}</Text> : null}
      </Column>
    </ScreenContainer>
  );
}

function makeStyles(colors: ModeColors) {
  return StyleSheet.create({
    body: {
      flex: 1,
    },
    title: {
      color: colors.text.default,
      fontSize: 24,
      fontWeight: '700',
    },
    caption: {
      color: colors.text.subtle,
      fontSize: 14,
    },
  });
}
