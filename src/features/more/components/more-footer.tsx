import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Row, Typography } from '@/shared/components';

export type MoreFooterProps = {
  onPressTerms?: () => void;
  onPressPrivacy?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** 이용약관 | 개인정보처리방침 링크. */
export function MoreFooter({ onPressTerms, onPressPrivacy, style }: MoreFooterProps) {
  return (
    <Row align="center" justify="center" gap="200" style={style}>
      <Pressable accessibilityRole="link" onPress={onPressTerms}>
        <Typography variant="body-sm" color="muted" style={styles.underline}>
          이용약관
        </Typography>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={onPressPrivacy}>
        <Typography variant="body-sm" color="muted" style={styles.underline}>
          개인정보처리방침
        </Typography>
      </Pressable>
    </Row>
  );
}

const styles = StyleSheet.create({
  underline: { textDecorationLine: 'underline' },
});
