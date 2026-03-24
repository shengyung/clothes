import type { NextAuthOptions } from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";

// LINE custom OAuth provider
const LineProvider = {
  id: "line",
  name: "LINE",
  type: "oauth" as const,
  authorization: {
    url: "https://access.line.me/oauth2/v2.1/authorize",
    params: { scope: "profile openid email" },
  },
  token: "https://api.line.me/oauth2/v2.1/token",
  userinfo: "https://api.line.me/v2/profile",
  profile(profile: { userId: string; displayName: string; pictureUrl?: string }) {
    return {
      id: profile.userId,
      name: profile.displayName,
      email: null,
      image: profile.pictureUrl ?? null,
    };
  },
  clientId: process.env.LINE_CLIENT_ID!,
  clientSecret: process.env.LINE_CLIENT_SECRET!,
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    LineProvider,
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
        token.providerAvatar =
          (profile as { pictureUrl?: string }).pictureUrl ??
          (profile as { picture?: string }).picture ??
          null;
      }
      return token;
    },
    async session({ session, token }) {
      const s = session as unknown as Record<string, unknown>;
      s.provider = token.provider;
      s.providerId = token.providerId;
      s.providerAvatar = token.providerAvatar;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
