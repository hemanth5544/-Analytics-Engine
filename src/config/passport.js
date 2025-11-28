import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { supabaseAdmin } from './database.js';
import dotenv from 'dotenv';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;

        const { data: existingUser, error: findError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('google_id', googleId)
          .maybeSingle();

        if (findError && findError.code !== 'PGRST116') {
          return done(findError, null);
        }

        if (existingUser) {
          return done(null, existingUser);
        }

        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert([
            {
              email,
              google_id: googleId,
              name
            }
          ])
          .select()
          .single();

        if (insertError) {
          return done(insertError, null);
        }

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return done(error, null);
    }

    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
