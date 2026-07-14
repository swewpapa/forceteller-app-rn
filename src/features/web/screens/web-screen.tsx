import { useCallback, useRef, type ForwardRefExoticComponent, type RefAttributes } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import RNWebView, { type WebViewNavigation, type WebViewProps } from 'react-native-webview';
import { useFocusEffect, type RouteProp } from '@react-navigation/native';
import { env } from '@/shared/config';
import { useAppColors } from '@/shared/theme';

/**
 * react-native-webview 14.0.1의 타입은 `class WebView<P = undefined>`로 선언돼,
 * props가 `WebViewProps & undefined`(= never)로 추론된다(React 19 @types에서 노출).
 * 올바른 props/ref 타입으로 재단언해 우회한다. 라이브러리 타입 수정 시 제거.
 */
const WebView = RNWebView as unknown as ForwardRefExoticComponent<
  WebViewProps & RefAttributes<RNWebView>
>;

/**
 * 'Web' 라우트 params 계약. 이 화면이 소유하고, app/navigation의
 * RootStackParamList가 이를 가져다 조립한다(의존 방향 app→features, features→app 0).
 */
export type WebRouteParams = { path: string; title?: string };

type Props = { route: RouteProp<{ Web: WebRouteParams }, 'Web'> };

/**
 * 상세/하위 페이지를 띄우는 단일 WebView 호스트.
 * 진입 path를 SPA 베이스 URL에 붙여 로드하고, 이후 화면 이동은 WebView 내부
 * SPA 라우팅으로 처리한다(재로드 없음). 뒤로가기는 WebView 히스토리를 우선한다.
 */
export function WebScreen({ route }: Props) {
  const { path } = route.params;
  const colors = useAppColors();
  const webRef = useRef<RNWebView>(null);
  const canGoBack = useRef(false);

  // Android 하드웨어 백: WebView에 히스토리가 있으면 네이티브 pop 대신 웹 back.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack.current) {
          webRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, []),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background.surface }]}>
      <WebView
        ref={webRef}
        source={{ uri: `${env.webBaseUrl}${path}` }}
        onNavigationStateChange={(nav: WebViewNavigation) => {
          canGoBack.current = nav.canGoBack;
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.text.default} />
          </View>
        )}
        // 캐싱: 실질은 서버 HTTP 헤더(Cache-Control/ETag)가 좌우한다.
        // cacheEnabled는 HTTP 캐시, domStorageEnabled는 SPA의 localStorage 지속용.
        // 재방문 reload가 거슬리면 Android cacheMode='LOAD_CACHE_ELSE_NETWORK' 검토.
        cacheEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
