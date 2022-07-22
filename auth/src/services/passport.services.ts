import passport from 'passport';
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

import { Request } from 'express';
import { User } from '../models/user.model';

// used to serialize the user for the session
passport.serializeUser(function (user, done) {
  done(null, user);
});

// used to deserialize the user
passport.deserializeUser(function (user: any, done) {
  done(null, user);
});

//Google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: 'https://portal-microservices.dev/api/auth/google/callback',
      passReqToCallback: true,
    },
    async (
      req: Request,
      _accessToken: any,
      _refreshToken: any,
      profile: any,
      done: (arg0: null, arg1: any) => void
    ) => {
      const user = await User.findOne({ googleId: profile.id });
      if (user) {
        done(null, user);
      }
      const newUser = User.build({
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value,
        profilePicture: profile.picture,
      });

      req.user = newUser;
      newUser.save();
      done(null, newUser);
    }
  )
);

//Facebook strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL:
        'https://portal-microservices.dev/api/auth/facebook/callback',
    },
    (
      _req: Request,
      _accessToken: any,
      _refreshToken: any,
      profile: any,
      done: (arg0: null, arg1: any) => void
    ) => {
      User.findOne({ facebookId: profile.id }).then((existingUser) => {
        if (existingUser) {
          // we already have a record with the given profile ID
          console.log(profile);

          done(null, existingUser);
        } else {
          // we don't have a user record with this ID, make a new record!
          User.build({
            facebookId: profile.id,
            username: profile.username || 'mohamed14',
            profilePicture: profile.profileUrl,
            gender: profile.gender,
          })
            .save()
            .then((user) => done(null, user));
        }
      });
    }
  )
);
