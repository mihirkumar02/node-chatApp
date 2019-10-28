const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByName){
    const authenticateUser = async (username, password, done) => {
        const user = getUserByName(username);

        if (user == null) {
            return done(null, false, { message: 'No Admin with that username!'});
        }

        try{
            if(await bcrypt.compare(password, user.password)) {
                return done(null, user, { message:'Welcome' + username });
            } else {
                return done(null, false, { message: 'Password Incorrect!' });
            }
        } catch (e){
            return done(e);
        }
    }

    passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.username));
    
    passport.deserializeUser((username, done) => {
        return done(null, getUserByName(username))
    });
}

module.exports = initialize;