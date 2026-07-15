import { Pressable, StyleSheet } from 'react-native';
import { AspectRatio, Column, Image, ListHeader, Row } from '@/shared/components';
import type { Premium, PremiumItem, PremiumLink } from '@/features/premium/types/premium-types';

type ButtonPremium = Extract<Premium, { type: 'button' }>;

// Figma 997:9157 실측: slide 154×164(≈ image 616×656). 프레임 radius 바인딩 없음 → 카드로 md 클립.
const BUTTON_RATIO = 154 / 164;

export type PremiumButtonProps = {
  premium: ButtonPremium;
  onPressLink: (link: PremiumLink) => void;
};

/**
 * button 변형: ListHeader + 한 줄 이미지 버튼 타일(각 flex:1로 폭 균등 분할, gap 12=spacing/150).
 * 타일은 서버 thumbnailImage 전용 — 텍스트는 이미지에 구워짐(Figma 997:9157 실측, Angular premium-list-button 동일).
 * 도메인 type='button'이나 DS Button이 아니라 이미지 타일이다. presentational — 탭은 onPressLink에 위임.
 */
export function PremiumButton({ premium, onPressLink }: PremiumButtonProps) {
  const { title, subtitle, items, moreLink } = premium;
  return (
    <Column gap="250">
      <ListHeader
        title={title}
        subtitle={subtitle ?? undefined}
        onPressViewAll={moreLink ? () => onPressLink(moreLink) : undefined}
      />
      <Row gap="150" align="flex-start">
        {items.map((item) => (
          <ButtonTile key={item.id} item={item} onPress={() => onPressLink(item.link)} />
        ))}
      </Row>
    </Column>
  );
}

function ButtonTile({ item, onPress }: { item: PremiumItem; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.tile}>
      <AspectRatio ratio={BUTTON_RATIO} radius="md">
        <Image source={item.thumbnailImage} accessibilityLabel={item.title} />
      </AspectRatio>
    </Pressable>
  );
}

const styles = StyleSheet.create({ tile: { flex: 1 } });
