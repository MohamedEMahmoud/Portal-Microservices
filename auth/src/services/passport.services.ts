import passport from 'passport';
const GoogleStrategy = require('passport-google-oauth2').Strategy;
import { Request } from 'express';

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
        (
            _req: Request,
            _accessToken: any,
            _refreshToken: any,
            profile: any,
            done: (arg0: null, arg1: any) => void
        ) => {
            console.log(profile);
            done(null, profile.id);
        }
    )
);