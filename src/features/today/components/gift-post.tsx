import { Image, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight } from '@fortawesome/pro-solid-svg-icons/faArrowRight';
import { faArrowDownToLine } from '@fortawesome/pro-solid-svg-icons/faArrowDownToLine';
import { Button, Column, Row, Typography } from '@/shared/components';
import { radius, useAppColors } from '@/shared/theme';
import { TodayPostHeader } from './today-post-header';
import { useTodayAction } from '../hooks/useTodayAction';
import type { GiftButton, TodayLink, TodayPost } from '../types/today-types';

type GiftPostData = Extract<TodayPost, { type: 'gift' }>;

export type GiftPostProps = {
  post: GiftPostData;
  onPressLink: (link: TodayLink) => void;
};

// 원본 버튼 아이콘(svg URL)은 RN Image로 못 그려 FA로 매핑. download→받기, 그 외→arrow-right.
function trailingIcon(iconUrl: string | null) {
  return iconUrl?.includes('download') ? faArrowDownToLine : faArrowRight;
}

/** gift 포스트 — 티켓(수량·SALE 배지) + 액션 버튼(쿠폰 받기=api 클레임 / 사용하기). */
export function GiftPost({ post, onPressLink }: GiftPostProps) {
  const colors = useAppColors();
  const action = useTodayAction();
  const item = post.items[0];

  if (!item) return null;

  const handlePress = (button: GiftButton) => {
    if (!button.action) return;
    if (button.action.type === 'api') {
      action.mutate({ postId: post.id, action: button.action });
    } else {
      onPressLink(button.action);
    }
  };

  return (
    <Column style={[styles.card, { backgroundColor: colors.background.surface }]}>
      <TodayPostHeader header={post.header} isDark={post.isDark} />
      <Column gap="200" style={styles.body}>
        <Row align="center" gap="200" style={[styles.ticket, { borderColor: colors.stroke.subtle }]}>
          <Column gap="50" style={styles.ticketContent}>
            <Typography variant="label-md" numberOfLines={1}>
              {item.title}
            </Typography>
            {item.amount ? (
              <Typography variant="label-md" style={{ color: item.color || colors.text.alert }}>
                {item.amount}
              </Typography>
            ) : null}
          </Column>
          {item.iconUrl ? <Image source={{ uri: item.iconUrl }} style={styles.badge} /> : null}
        </Row>
        <Row gap="150">
          {item.buttons.map((button) => {
            const blocked = button.disabled || !button.action;
            return (
              <Button
                key={button.text}
                label={button.text}
                color="secondary"
                appearance="solid"
                shape="pill"
                size="md"
                disabled={blocked}
                loading={button.action?.type === 'api' && action.isPending}
                trailing={
                  <FontAwesomeIcon
                    icon={trailingIcon(button.iconUrl)}
                    size={12}
                    color={blocked ? colors.secondary.onSecondaryDisabled : colors.secondary.onSecondary}
                  />
                }
                onPress={() => handlePress(button)}
              />
            );
          })}
        </Row>
      </Column>
    </Column>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  body: { paddingHorizontal: 20, paddingBottom: 20 },
  // TODO(디자인): Figma는 티켓 배경이 노치 이미지(imgGift). 1차는 보더 카드로 근사, 시각검증 후 정밀화.
  ticket: { borderWidth: 1, borderRadius: radius.md, padding: 20, minHeight: 84 },
  ticketContent: { flex: 1 },
  badge: { width: 32, height: 32 },
});
