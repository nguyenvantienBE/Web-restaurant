import { SetMetadata } from '@nestjs/common';

export const CLAIMS_KEY = 'claims';
export const RequireClaims = (...claims: string[]) => SetMetadata(CLAIMS_KEY, claims);
