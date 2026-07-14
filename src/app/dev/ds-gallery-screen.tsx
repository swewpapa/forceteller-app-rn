import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { faCopy } from '@fortawesome/pro-light-svg-icons/faCopy';
import { faInbox } from '@fortawesome/pro-light-svg-icons/faInbox';
import { faShareNodes } from '@fortawesome/pro-light-svg-icons/faShareNodes';
import {
  ActionButton,
  AppBar,
  AspectRatio,
  Box,
  Button,
  Checkbox,
  Chip,
  Column,
  EmptyState,
  Likes,
  LinkText,
  ListHeader,
  ListItem,
  PriceTag,
  Row,
  ScreenContainer,
  TagChip,
  TagLabel,
  TextField,
  Thumbnail,
  Typography,
} from '@/shared/components';
import { spacing, useTheme, type TypographyVariant } from '@/shared/theme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Column gap="150">
      <Typography variant="label-sm" color="muted">
        {title}
      </Typography>
      {children}
    </Column>
  );
}

// dev 갤러리 데모용 원격 placeholder(네트워크 필요). 실사용은 서버 드리븐 uri.
const SAMPLE_IMG = 'https://picsum.photos/240/126';

const TYPO_SAMPLES: TypographyVariant[] = [
  'headline-md',
  'body-md',
  'body-sm',
  'label-lg',
  'label-md',
  'label-sm',
];

/**
 * DS 갤러리(dev 전용 상설). 새 shared 컴포넌트는 여기 섹션을 함께 추가한다
 * (규약 §9 — 발견성 + 시각 회귀 기준 화면). 진입: More 탭 long-press.
 * 서버/폼 결합이 필요한 것(Image·Carousel·Field/FormTextField)은 실사용 화면 참조.
 */
export function DsGalleryScreen() {
  const { resolvedTheme, setMode } = useTheme();
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(true);
  const [selected, setSelected] = useState(true);
  const [liked, setLiked] = useState(true);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Row justify="space-between" align="center">
          <Typography variant="headline-md">DS Gallery</Typography>
          <Button
            label={`테마: ${resolvedTheme}`}
            size="sm"
            appearance="outline"
            onPress={() => setMode(resolvedTheme === 'night' ? 'day' : 'night')}
          />
        </Row>

        <Section title="AppBar — 탭 chrome (BI + 표준 액션/badge · 홈 변형 event 제외)">
          <AppBar onPressAction={() => {}} />
          <AppBar actions={['search', 'freeForce', 'calendar']} onPressAction={() => {}} />
        </Section>

        <Section title="Typography — 대표 variant">
          {TYPO_SAMPLES.map((v) => (
            <Typography key={v} variant={v}>
              {v} — 포스텔러
            </Typography>
          ))}
        </Section>

        <Section title="Button — color × appearance / size / shape / 상태">
          <Row gap="150">
            <Button label="Solid P" onPress={() => {}} />
            <Button label="Outline P" appearance="outline" onPress={() => {}} />
          </Row>
          <Row gap="150">
            <Button label="Solid S" color="secondary" onPress={() => {}} />
            <Button label="Outline S" color="secondary" appearance="outline" onPress={() => {}} />
          </Row>
          <Row gap="150" align="center">
            <Button label="lg" size="lg" onPress={() => {}} />
            <Button label="md" size="md" onPress={() => {}} />
            <Button label="sm" size="sm" onPress={() => {}} />
            <Button label="pill" shape="pill" size="sm" onPress={() => {}} />
          </Row>
          <Row gap="150" align="center">
            <Button label="disabled" disabled onPress={() => {}} />
            <Button label="outline dis" appearance="outline" disabled onPress={() => {}} />
            <Button label="loading" loading onPress={() => {}} />
          </Row>
        </Section>

        <Section title="TextField — default / typing / error / disabled">
          <TextField value={text} onChangeText={setText} placeholder="Placeholder" />
          <TextField value="에러 상태" onChangeText={() => {}} error />
          <TextField value="비활성" onChangeText={() => {}} disabled />
        </Section>

        <Section title="Checkbox — md/sm, 위치, 아이콘 온리">
          <Checkbox checked={checked} onChange={setChecked} label="동의합니다 (md)" />
          <Checkbox checked={checked} onChange={setChecked} label="동의합니다 (sm)" size="sm" />
          <Checkbox
            checked={checked}
            onChange={setChecked}
            label="체크박스 우측"
            checkboxPosition="right"
          />
          <Row gap="150" align="center">
            <Checkbox checked onChange={() => {}} />
            <Checkbox checked={false} onChange={() => {}} />
            <Typography variant="body-sm" color="muted">
              ← 라벨 없음
            </Typography>
          </Row>
        </Section>

        <Section title="Chip 패밀리 — Chip(keyword) / TagChip(선택) / TagLabel(status)">
          <Row gap="100">
            <Chip label="키워드" onPress={() => {}} />
            <Chip label="더보기" appearance="solid" onPress={() => {}} />
          </Row>
          <Row gap="100">
            <TagChip label="전체" selected={selected} onPress={() => setSelected((s) => !s)} />
            <TagChip label="미선택" selected={false} onPress={() => {}} />
          </Row>
          <Row gap="100">
            <TagLabel label="성향" />
            <TagLabel label="성향" variant="highlighted" />
            <TagLabel
              label="불"
              variant={{ background: 'accent.fireTonal', text: 'accent.onFireTonal' }}
            />
            <TagLabel
              label="물"
              variant={{ background: 'accent.waterTonal', text: 'accent.onWaterTonal' }}
            />
          </Row>
        </Section>

        <Section title="LinkText / ActionButton / Likes">
          <LinkText label="출석 체크하기" colored onPress={() => {}} />
          <LinkText label="출석 체크하기" onPress={() => {}} />
          <Row gap="300" align="center">
            <ActionButton icon={faCopy} label="복사" onPress={() => {}} />
            <ActionButton icon={faShareNodes} label="공유" onPress={() => {}} />
          </Row>
          <Row gap="300" align="center">
            <Likes count={9999} liked={liked} size="small" onPress={() => setLiked((l) => !l)} />
            <Likes count={9999} liked={liked} size="large" onPress={() => setLiked((l) => !l)} />
          </Row>
        </Section>

        <Section title="ListHeader / ListItem">
          <ListHeader title="섹션 타이틀" subtitle="서브타이틀" onPressViewAll={() => {}} />
          <ListItem
            label="사주"
            labelColor="#5870d0"
            title="리스트 아이템 제목"
            onPress={() => {}}
          />
          <ListItem title="라벨 없는 아이템" onPress={() => {}} />
        </Section>

        <Section title="PriceTag — type / discount / inversed">
          <Row gap="300" align="center">
            <PriceTag price={1000} />
            <PriceTag price={500} discount discounted={1000} percentage="50%" />
            <PriceTag price={4749} type="bonus" />
          </Row>
          {/* on-dark 샘플 — 다크 표면은 background 토큰에 없어 style 탈출구로 고정 hex. */}
          <Box p="150" radius="md" style={styles.inversedBox}>
            <PriceTag price={1000} inversed />
          </Box>
        </Section>

        <Section title="AspectRatio — 16:9">
          <AspectRatio ratio={16 / 9}>
            <Box color="highlight" radius="md" style={styles.fill} />
          </AspectRatio>
        </Section>

        <Section title="Thumbnail — ratio·radius 변형 (source는 dev placeholder)">
          <Row gap="150">
            <Box style={styles.thumb144}>
              <Thumbnail source={SAMPLE_IMG} ratio={144 / 92} accessibilityLabel="리스트 썸네일" />
            </Box>
            <Box style={styles.thumb92}>
              <Thumbnail
                source={SAMPLE_IMG}
                ratio={92 / 128}
                radius="xs"
                accessibilityLabel="페이트북 썸네일"
              />
            </Box>
          </Row>
        </Section>

        <Section title="EmptyState — 아이콘 + 제목/설명 + action">
          <EmptyState
            icon={faInbox}
            title="아직 내역이 없어요."
            description="출석 체크로 보너스포스를 모아 보세요."
            action={<LinkText label="출석 체크하기" colored onPress={() => {}} />}
          />
        </Section>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing[200], gap: spacing[300], paddingBottom: spacing[900] },
  inversedBox: { alignSelf: 'flex-start', backgroundColor: '#191919' },
  fill: { flex: 1 },
  thumb144: { width: 144 },
  thumb92: { width: 92 },
});
