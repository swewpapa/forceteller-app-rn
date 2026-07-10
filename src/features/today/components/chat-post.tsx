import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Button, Column, Typography } from '@/shared/components';
import { radius, useAppColors } from '@/shared/theme';
import { TodayPostHeader } from './today-post-header';
import { useTodayAction } from '../hooks/useTodayAction';
import type { ChatMessage, TodayApiLink, TodayLink, TodayPost } from '../types/today-types';

type ChatPostData = Extract<TodayPost, { type: 'chat' }>;

export type ChatPostProps = {
  post: ChatPostData;
  /** 디스패처 시그니처 통일용(chat 액션은 api라 미사용). */
  onPressLink?: (link: TodayLink) => void;
};

/** chat 포스트 — 아바타 헤더 + 말풍선 + 피커(tarot 단일카드+확정 / carousel 이미지 탭선택). */
export function ChatPost({ post }: ChatPostProps) {
  const colors = useAppColors();
  const action = useTodayAction();
  const { picker } = post;

  const select = (link: TodayApiLink) => action.mutate({ postId: post.id, action: link });

  return (
    <Column style={[styles.card, { backgroundColor: post.bgColor ?? colors.background.surface }]}>
      <TodayPostHeader header={post.header} isDark={post.isDark} />
      <Column gap="150" style={styles.body}>
        {post.messages.map((message, i) => (
          <ChatBubble key={i} message={message} bubbleColor={colors.background.inset} />
        ))}

        {picker.caption ? (
          <Typography variant="body-sm" color="muted" style={styles.caption}>
            {picker.caption}
          </Typography>
        ) : null}

        {picker.kind === 'tarot' ? (
          <Column align="center" gap="150">
            <Image source={{ uri: picker.cardSrc }} style={styles.tarotCard} resizeMode="contain" />
            <Button
              label={picker.submitText}
              color="secondary"
              appearance="solid"
              shape="pill"
              size="md"
              loading={action.isPending}
              onPress={() => select(picker.submit)}
            />
          </Column>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {picker.cards.map((card, i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                disabled={action.isPending}
                onPress={() => select(card.action)}
              >
                <Image source={{ uri: card.src }} style={styles.carouselCard} resizeMode="contain" />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </Column>
    </Column>
  );
}

function ChatBubble({ message, bubbleColor }: { message: ChatMessage; bubbleColor: string }) {
  if (message.kind === 'image') {
    return <Image source={{ uri: message.src }} style={styles.bubbleImage} resizeMode="cover" />;
  }
  return (
    <Column style={[styles.bubble, { backgroundColor: bubbleColor }]}>
      <Typography variant="body-md">{message.text}</Typography>
    </Column>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  body: { paddingHorizontal: 20, paddingBottom: 20 },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  bubbleImage: { alignSelf: 'flex-start', width: '70%', aspectRatio: 1, borderRadius: radius.md },
  caption: { textAlign: 'center', marginTop: 4 },
  // TODO(디자인): Figma는 tarot 카드 덱(가로 스와이프) — 1차는 단일 카드. carousel 카드 크기 실측 후 정밀화.
  tarotCard: { width: 120, height: 180 },
  carousel: { gap: 8, paddingVertical: 4 },
  carouselCard: { width: 80, height: 80 },
});
