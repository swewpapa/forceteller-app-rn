import { createContext, useContext } from 'react';

/**
 * AppBar → 하위 AppBarButton(FA icon)로 아이콘 색을 전파한다.
 * undefined면 버튼이 text.default를 쓴다. 투데이 히어로 오버레이만 흰색 등으로 지정.
 * children(커스텀 SVG)의 색은 화면이 직접 준다(context가 임의 요소엔 못 미침).
 */
const AppBarIconColorContext = createContext<string | undefined>(undefined);

export const AppBarIconColorProvider = AppBarIconColorContext.Provider;

export const useAppBarIconColor = (): string | undefined => useContext(AppBarIconColorContext);
