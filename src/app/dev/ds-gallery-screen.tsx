import { useState, type ReactNode } from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCopy } from '@fortawesome/pro-light-svg-icons/faCopy';
import { faShareNodes } from '@fortawesome/pro-light-svg-icons/faShareNodes';
import { faMagnifyingGlass } from '@fortawesome/pro-light-svg-icons/faMagnifyingGlass';
import { faCalendarDays } from '@fortawesome/pro-light-svg-icons/faCalendarDays';
import {
  ActionButton,
  AppBar,
  AppBarButton,
  AspectRatio,
  Box,
  Button,
  Checkbox,
  Chip,
  Column,
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
  Typography,
} from '@/shared/components';
import { spacing, useAppColors, useTheme, type TypographyVariant } from '@/shared/theme';

const LOGO = require('../../assets/forceteller-logo.png');

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
  const colors = useAppColors();
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

        <Section title="AppBar (Root) — leading BI + trailing(아이콘/badge)">
          <AppBar
            leading={
              <AppBarButton accessibilityLabel="홈">
                <Image source={LOGO} style={styles.appBarLogo} resizeMode="contain" />
              </AppBarButton>
            }
            trailing={
              <>
                <AppBarButton accessibilityLabel="검색" onPress={() => {}}>
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    size={20}
                    color={colors.text.default}
                  />
                </AppBarButton>
                <AppBarButton badge accessibilityLabel="캘린더" onPress={() => {}}>
                  <FontAwesomeIcon icon={faCalendarDays} size={20} color={colors.text.default} />
                </AppBarButton>
              </>
            }
          />
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
          <Checkbox checked={checked} onChange={setChecked} label="체크박스 우측" checkboxPosition="right" />
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
            <TagLabel label="불" variant={{ background: 'accent.fireTonal', text: 'accent.onFireTonal' }} />
            <TagLabel label="물" variant={{ background: 'accent.waterTonal', text: 'accent.onWaterTonal' }} />
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
          <ListItem label="사주" labelColor="#5870d0" title="리스트 아이템 제목" onPress={() => {}} />
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
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing[200], gap: spacing[300], paddingBottom: spacing[900] },
  inversedBox: { alignSelf: 'flex-start', backgroundColor: '#191919' },
  appBarLogo: { width: 36, height: 36 },
  fill: { flex: 1 },
});
