import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight } from '@fortawesome/pro-light-svg-icons/faArrowRight';
import type { TodayHero, TodayLink } from '../types/today-types';

const HERO_HEIGHT = 480;
const BG_HEIGHT = 464;
const ANIMAL_SIZE = 256;
// 히어로 텍스트 시작 y(Figma 128 ≈ status 60 + app bar 44 + 여백). 앱 바 아래로 확보.
const CONTENT_TOP = 128;

export type TodayHeroViewProps = {
  hero: TodayHero;
  onPressLink?: (link: TodayLink) => void;
};

/**
 * 투데이 상단 히어로(Figma <today-hero>, 480h). 원격 SVG 배경 + 오늘 문구(textColor) + 동물 이미지.
 * 서버가 게스트/회원 문구를 내려주므로 순수 프레젠테이셔널. 배경·동물은 원격/data-URI SVG라
 * SvgUri로 렌더(실기 렌더 확인은 QA). slot_empty(액막이 추가 카드)는 후속.
 */
export function TodayHeroView({ hero, onPressLink }: TodayHeroViewProps) {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.root}>
      {hero.backgroundImage ? (
        <SvgUri
          uri={hero.backgroundImage}
          width={width}
          height={BG_HEIGHT}
          preserveAspectRatio="xMidYMid slice"
          style={styles.bg}
        />
      ) : null}

      {hero.animalImage ? (
        <SvgUri
          uri={hero.animalImage}
          width={ANIMAL_SIZE}
          height={ANIMAL_SIZE}
          style={styles.animal}
        />
      ) : null}

      <View style={styles.content}>
        {hero.caption ? (
          <Text style={[styles.caption, { color: hero.textColor }]}>{hero.caption}</Text>
        ) : null}
        <Text style={[styles.headline, { color: hero.textColor }]}>{hero.headline}</Text>
        {hero.link ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => hero.link && onPressLink?.(hero.link)}
            style={styles.link}
          >
            <Text style={[styles.linkLabel, { color: hero.textColor }]}>자세히 보기</Text>
            <FontAwesomeIcon icon={faArrowRight} size={12} color={hero.textColor} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: HERO_HEIGHT, position: 'relative', overflow: 'hidden' },
  bg: { position: 'absolute', top: 0, left: 0 },
  animal: { position: 'absolute', right: -28, bottom: 0 },
  content: {
    position: 'absolute',
    top: CONTENT_TOP,
    left: 28,
    right: 20,
    gap: 12,
  },
  // 히어로 타이틀은 서버 hex(textColor)라 Typography 토큰색 대신 raw Text. headline-lg(28/36).
  caption: { fontSize: 28, lineHeight: 36, fontWeight: '400', letterSpacing: -0.56 },
  headline: { fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.56 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  linkLabel: { fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: -0.28 },
});
