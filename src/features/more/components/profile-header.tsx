import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser } from '@fortawesome/pro-solid-svg-icons/faUser';
import { faPen } from '@fortawesome/pro-solid-svg-icons/faPen';
import { Column, Row, Typography } from '@/shared/components';
import { radius, useAppColors } from '@/shared/theme';

export type ProfileHeaderProps = {
  nickname: string;
  dayAnimal: string;
  uid: string;
  /** 프로필 이미지 URL. 없으면 faUser 플레이스홀더. */
  avatarURL?: string | null;
  onEditPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * 마이페이지 프로필 헤더 — 아바타 + 일주동물/닉네임/uid + 수정 버튼.
 * 아바타·닉네임은 실데이터(useMe). 일주동물·uid는 소스 부재로 상위에서 placeholder 주입.
 */
export function ProfileHeader({
  nickname,
  dayAnimal,
  uid,
  avatarURL,
  onEditPress,
  style,
}: ProfileHeaderProps) {
  const colors = useAppColors();
  return (
    <Row align="center" gap="250" style={style}>
      {avatarURL ? (
        <Image source={{ uri: avatarURL }} style={styles.avatar} />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarFallback,
            { backgroundColor: colors.background.inset },
          ]}
        >
          <FontAwesomeIcon icon={faUser} size={30} color={colors.text.muted} />
        </View>
      )}
      <Column gap="50" style={styles.info}>
        <Typography variant="label-md" color="force">
          {dayAnimal}
        </Typography>
        <Typography variant="headline-md">{nickname}</Typography>
        <Typography variant="body-xs" color="muted" numberOfLines={1}>
          {uid}
        </Typography>
      </Column>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="프로필 수정"
        onPress={onEditPress}
        style={[styles.edit, { borderColor: colors.stroke.subtle }]}
      >
        <FontAwesomeIcon icon={faPen} size={14} color={colors.text.subtle} />
      </Pressable>
    </Row>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  edit: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
