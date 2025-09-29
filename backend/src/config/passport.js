const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/user.model');

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Find the user by ID from JWT payload
      const user = await User.findById(payload.id);
      
      if (!user) {
        return done(null, false);
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ 
            $or: [
              { googleId: profile.id },
              { email: profile.emails[0].value }
            ]
          });
          
          // If user doesn't exist, create a new one
          if (!user) {
            user = new User({
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              avatar: profile.photos[0].value
            });
            await user.save();
          } else if (!user.googleId) {
            // If user exists but doesn't have googleId (registered with email)
            user.googleId = profile.id;
            user.avatar = user.avatar || profile.photos[0].value;
            await user.save();
          }
          
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Get primary email from GitHub
          const primaryEmail = profile.emails && profile.emails[0].value;
          
          if (!primaryEmail) {
            return done(new Error('Email not available from GitHub'), false);
          }
          
          // Check if user already exists
          let user = await User.findOne({ 
            $or: [
              { githubId: profile.id },
              { email: primaryEmail }
            ]
          });
          
          // If user doesn't exist, create a new one
          if (!user) {
            user = new User({
              githubId: profile.id,
              email: primaryEmail,
              name: profile.displayName || profile.username,
              avatar: profile.photos[0].value
            });
            await user.save();
          } else if (!user.githubId) {
            // If user exists but doesn't have githubId (registered with email)
            user.githubId = profile.id;
            user.avatar = user.avatar || profile.photos[0].value;
            await user.save();
          }
          
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}

module.exports = passport;
