import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Button, Column, Row, Typography } from '@/shared/components';
import { radius, useAppColors } from '@/shared/theme';
import { useTodayAction } from '../hooks/useTodayAction';
import type { ChatMessage, TodayLink, TodayPost } from '../types/today-types';
import { TodayPostHeader } from './today-post-header';

type ChatPostData = Extract<TodayPost, { type: 'chat' }>;

export type ChatPostProps = {
  post: ChatPostData;
  /** 디스패처 시그니처 통일용(chat 액션은 api라 미사용). */
  onPressLink?: (link: TodayLink) => void;
};

// 타로 덱: 동일 카드백을 76장 반복(레거시 today-post-chat-message-tarot 실측). 겹쳐서 부채꼴로.
const TAROT_DECK_SIZE = 76;

/** chat 포스트 — 아바타 헤더 + 말풍선 + 피커(tarot 덱 스와이퍼+확정 / carousel 이미지 탭선택). */
export function ChatPost({ post }: ChatPostProps) {
  const colors = useAppColors();
  const action = useTodayAction();
  const { picker } = post;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <Column style={[styles.card, { backgroundColor: post.bgColor ?? colors.background.surface }]}>
      <TodayPostHeader header={post.header} isDark={post.isDark} />
      <Column gap="150" style={styles.body}>
        {post.messages.map((message, i) => (
          <ChatBubble key={i} message={message} bubbleColor={colors.background.inset} />
        ))}

        {picker.kind === 'tarot' ? (
          <>
            {/* 76장 덱: 탭하면 선택(토글)되고 그 카드만 아래로 내려온다. z-index로 겹침 순서. */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.deck}
            >
              {Array.from({ length: TAROT_DECK_SIZE }).map((_, i) => {
                const picked = selectedIndex === i;
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityState={{ selected: picked }}
                    onPress={() => setSelectedIndex(picked ? null : i)}
                    style={[
                      styles.cardWrap,
                      picked && styles.cardPicked,
                      { zIndex: picked ? TAROT_DECK_SIZE + 1 : i },
                    ]}
                  >
                    <Image
                      source={{ uri: picker.cardSrc }}
                      style={styles.tarotCard}
                      resizeMode="contain"
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
            {picker.caption && selectedIndex === null ? (
              <Typography variant="body-sm" color="muted" style={styles.caption}>
                {picker.caption}
              </Typography>
            ) : null}
            <Row justify="flex-end">
              <Button
                label={picker.submitText}
                color="secondary"
                appearance="solid"
                shape="pill"
                size="md"
                disabled={selectedIndex === null}
                loading={action.isPending}
                onPress={() => {
                  if (selectedIndex === null) return;
                  action.mutate({
                    postId: post.id,
                    action: picker.submit,
                    payload: { selectedIndex },
                  });
                }}
              />
            </Row>
          </>
        ) : (
          <>
            {picker.caption ? (
              <Typography variant="body-sm" color="muted" style={styles.caption}>
                {picker.caption}
              </Typography>
            ) : null}
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
                  onPress={() => action.mutate({ postId: post.id, action: card.action })}
                >
                  <Image
                    source={{ uri: card.src }}
                    style={styles.carouselCard}
                    resizeMode="contain"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </>
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
  // tarot 덱(레거시 실측): 카드 height 90, margin-right -32(겹침), 선택 시 translateY 16.
  deck: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },
  cardWrap: { marginRight: -32 },
  cardPicked: { transform: [{ translateY: 16 }] },
  tarotCard: { width: 60, height: 90 },
  carousel: { gap: 8, paddingVertical: 4 },
  carouselCard: { width: 80, height: 80 },
});
