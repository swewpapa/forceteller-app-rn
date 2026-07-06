import type { ReactNode } from 'react';
import { Column } from '../layout';
import { Typography } from '../typography';

export type FieldProps = {
  /** 있으면 label-md로 표시 (Figma 106:3419 라벨 14/500 정확 일치) */
  label?: string;
  /**
   * 있으면 label-sm/alert로 표시. 검증 계층(FormTextField 등)이 내려준다 —
   * Field는 검증을 모른다(순수 표시). 없으면 에러 줄 자체를 렌더하지 않는다(공간 미예약).
   */
  error?: string;
  children: ReactNode;
};

/** 폼 필드 해부(라벨+컨트롤+에러메시지)의 순수 표시 래퍼. RHF 의존 0 — 규약 §2 "무접두사 = 순수 DS". */
export function Field({ label, error, children }: FieldProps) {
  return (
    <Column gap="150">
      {label ? <Typography variant="label-md">{label}</Typography> : null}
      {children}
      {error ? (
        <Typography variant="label-sm" color="alert">
          {error}
        </Typography>
      ) : null}
    </Column>
  );
}
