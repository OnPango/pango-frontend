import type { SessionResponseDto } from '@/core/auth/user.mappers';

export type LoginRequest = {
  email: string;
  password: string;
};

/** `POST /auth/login` body. No token: the backend sends it as an httpOnly cookie (`Set-Cookie`). */
export type LoginResponseDto = SessionResponseDto;
