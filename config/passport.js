import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

// Load the user model
import User from '../app/models/user.js';
import config from '../config/database.js'; // get db config file

export default function(passport) {
  const opts = {};
  opts.secretOrKey = config.secret;
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); // Extract JWT from Authorization header

  passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    User.findOne({ id: jwt_payload.id }, (err, user) => {
      if (err) {
        return done(err, false);
      }
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    });
  }));
};
