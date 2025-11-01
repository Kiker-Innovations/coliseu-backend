import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(
    password: string,
    hash: string,
): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

export async function generateCode(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const bytes = randomBytes(6);
    let code = "";
    for (const byte of bytes) {
        code += chars[byte % chars.length];
    }
    return code;
}

export async function generateResetToken(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const bytes = randomBytes(32);
    let token = "";
    for (const byte of bytes) {
        token += chars[byte % chars.length];
    }
    return token;
}