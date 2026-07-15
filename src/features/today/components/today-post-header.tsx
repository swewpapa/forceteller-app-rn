import { StyleSheet, View } from 'react-native';
import { AspectRatio, Column, Image, Row, Typography } from '@/shared/components';
import type { TodayHeader } from '@/features/today/types/today-types';

export type TodayPostHeaderProps = {
  header: TodayHeader;
  isDark: boolean;
};

/**
 * 서버 isDark 포스트의 강제 다크 색 — 앱 day/night 테마와 무관하게 적용한다.
 * 값은 레거시 Angular today-post `.dark-mode`(color:#fff / background:#101926) 실측.
 * 포스트가 어두운 이미지/배경을 깔기 때문에 앱 테마를 따르면 대비가 깨진다(테마 독립).
 */
export const POST_DARK = {
  bg: '#101926',
  text: '#ffffff',
  subtle: 'rgba(255, 255, 255, 0.6)',
  divider: 'rgba(255, 255, 255, 0.1)', // 다크 포스트 구분선 — 레거시 Angular `.color-white` 실측
} as const;

// bgImage(밝은 날씨 이미지 등) 위 !isDark 헤더는 앱 테마 무관하게 어두운 텍스트 고정(Figma day 토큰 실측).
const IMAGE_TITLE = '#191919';
const IMAGE_SUBTITLE = '#686868';

const HEADER_MIN_HEIGHT = 86; // Angular min-height 5.375rem — bgImage 없을 때 바닥
const HEADER_BG_HEIGHT = 168; // Angular .with-bg 10.5rem = Figma weather 헤더 h-168
const PORTRAIT_SIZE = 52; // Angular 원형 아바타 3.25rem

/**
 * today 포스트 공통 헤더: (선택)portrait 원형 아바타 + subtitle/title.
 * bgImage 있으면 배경으로 깔고 높이 고정(weather), 없으면 카드 표면 위(full_image).
 * 텍스트 색 우선순위: isDark(밝게) → bgImage 위(밝은 이미지라 어둡게 고정) → 앱 테마.
 * premium ListHeader에 대응하는 today 전용 헤더(Figma 실측상 subtitle=body-md로 ListHeader보다 큼).
 */
export function TodayPostHeader({ header, isDark }: TodayPostHeaderProps) {
  const { title, subtitle, portrait, bgImage } = header;
  const hasBg = !!bgImage;

  // 밝은 이미지 위 헤더를 앱 테마에 맡기면 night 모드에서 흰 글씨가 밝은 하늘에 묻힌다 → 어둡게 고정.
  const onImage = !isDark && hasBg;
  const titleStyle = isDark ? styles.darkTitle : onImage ? styles.imageTitle : undefined;
  const subtitleStyle = isDark ? styles.darkSubtitle : onImage ? styles.imageSubtitle : undefined;

  return (
    <Row
      align={hasBg ? 'flex-start' : 'flex-end'}
      gap="200"
      p="250"
      style={hasBg ? styles.withBg : styles.noBg}
    >
      {bgImage ? (
        <View style={StyleSheet.absoluteFill}>
          <Image source={bgImage} contentFit="cover" />
        </View>
      ) : null}
      {portrait ? (
        <AspectRatio ratio={1} radius="xl" style={styles.portrait}>
          <Image source={portrait} accessibilityLabel={title} />
        </AspectRatio>
      ) : null}
      <Column style={styles.content}>
        {subtitle ? (
          <Typography variant="body-md" color="subtle" numberOfLines={1} style={subtitleStyle}>
            {subtitle}
          </Typography>
        ) : null}
        <Typography variant="headline-md" numberOfLines={2} style={titleStyle}>
          {title}
        </Typography>
      </Column>
    </Row>
  );
}

const styles = StyleSheet.create({
  noBg: { minHeight: HEADER_MIN_HEIGHT },
  withBg: { height: HEADER_BG_HEIGHT },
  portrait: { width: PORTRAIT_SIZE },
  content: { flex: 1 },
  darkTitle: { color: POST_DARK.text },
  darkSubtitle: { color: POST_DARK.subtle },
  imageTitle: { color: IMAGE_TITLE },
  imageSubtitle: { color: IMAGE_SUBTITLE },
});
