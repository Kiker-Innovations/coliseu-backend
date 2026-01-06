import { z } from "zod";

const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, "Refresh token é obrigatório"),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export function transformRefreshTokenDto(data: unknown): RefreshTokenDto {
	return refreshTokenSchema.parse(data);
}
