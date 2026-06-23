/** Remote splash 설정 (static.forceteller.com/.../splash.json 응답). */
export type SplashConfig = {
  ios?: string;
  android?: string;
  id?: string;
};

/** 로컬에 저장하는 "현재 적용된 이미지" 메타. */
export type SplashMeta = {
  appliedUrl: string;
  appliedId: string;
};
