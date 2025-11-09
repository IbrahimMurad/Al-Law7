import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { BlobsStorage } from "./blobs-storage";

let isAuthConfigured = false;

export function setupAuth(storage: BlobsStorage) {
  if (isAuthConfigured) {
    return;
  }

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientID || !clientSecret) {
    console.warn("Google OAuth not configured: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing");
    isAuthConfigured = true;
    return;
  }

  const callbackURL = process.env.NODE_ENV === "production"
    ? `${process.env.URL}/api/auth/google/callback`
    : "http://localhost:8888/api/auth/google/callback";

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let sheikh = await storage.getSheikhByGoogleId(profile.id);

          if (!sheikh) {
            sheikh = await storage.createSheikh({
              googleId: profile.id,
              email: profile.emails?.[0]?.value || "",
              name: profile.displayName,
              picture: profile.photos?.[0]?.value,
            });
          }

          return done(null, sheikh);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const sheikh = await storage.getSheikh(id);
      done(null, sheikh);
    } catch (error) {
      done(error);
    }
  });

  isAuthConfigured = true;
}
