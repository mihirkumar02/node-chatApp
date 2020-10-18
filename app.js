const express = require('express');
const socketIO = require('socket.io');

const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

const http = require('http');

const initializePassport = require('./passport-config');
initializePassport(
    passport, 
    username => users.find(user => user.username === username)
)

var app = express();
var server = http.createServer(app);

var io = socketIO(server);


var port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.static('./public'));

app.use(flash());
app.use(session({
    secret: "This is our project",
    resave: false,
    saveUninitialized: false
}));
app.use(methodOverride('_method'));


app.use(passport.initialize());
app.use(passport.session());


var people = [];
var users = [];

var password = "";
var passwordArray = ['c8d1d2d3d4d5d6d7d8c1c2c3c4c5c6c7c8d1d2d3d4d5d6d7d8c1c2c3c4c5c6c7',
                     'c1c2c3c2d3d4d5d6d7d8c1c2c3c4c5c6c7c8d4c5c6c7c8d1d1d2d3d4d5d6d7d8',
                     'c1c2c3c4c5c6c7c8d1c1c2c3c4c5c6c7c8d1d2d3d4d5d6d7d8d2d3d4d5d6d7d8',
                     'c1c2c3c4c5c6c7c8d1d2d3d4d5d6d7d8c1c2c3c4c5c6c7c8d1d2d3d4d5d6d7d8',
                     'c1c2c3c4c53c4c5c6c4d5d6d7d8c67c8d1d2d3dc7c8d1d2d3d4d5d6d7d8c1c2c',
                     'c1c2c3c7d818d1d2d3dc1c2c3c4c5c4c5c6c6c7c87c4d5d6ddd2d3d4d5d6d7d8'
                    ];


    for(var k=0;k<passwordArray.length;k++)
    {
        var a = passwordArray[k].split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
        passwordArray[k] = a.join("");
        password = password+passwordArray[k];
    }





io.on('connection',function(socket){
    console.log('New User Connected');
    
    socket.on('join',function(params,callback){
        socket.join(params.chatroom);
        socket.broadcast.emit('newUserConnected',{name: params.username});
        socket.emit('welcomeMessage',{password: password});
    });
    
    socket.on('createMessage',function(newMsg){
        io.emit('newMessage',{
            name: newMsg.name,
            message: newMsg.message
        });
    });
    
    socket.on('disconnect',function(){
        console.log('User Disconnected');
    });
});




app.get('/admin', checkAuthenticated, function(req,res){
    res.render('admin.ejs',{data:people, username: req.user.username });
});

app.get('/login', checkNotAuthenticated, function(req,res){
    res.render('login.ejs');
});

app.post('/login',checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/addUser',function(req,res){
    if (people.indexOf(req.query.username) == -1)
        people.push(req.query.username);
    res.redirect('admin');
});

app.get('/deleteUser', function(req,res){
    var user = req.query.usernamedel;
    for( var i = 0; i < people.length; i++){
        if(people[i] == user)
            people.pop(user);
    }
    res.redirect('admin');
});

app.get('/logon',function(req,res){
    console.log("Coming here, can check!!");
    if (people.indexOf(req.query.username) > -1) {
    res.redirect('chat.html?username='+req.query.username);
    } else {
    res.redirect('index.html');
    }
    
});

app.get('/magic', checkNotAuthenticated, function(req,res){
    res.render('magic.ejs');
});

app.post('/magic', checkNotAuthenticated, async function(req,res){
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            username: req.body.username,
            password: hashedPassword
        })
        res.redirect('/login');
    }
    catch{
        res.redirect('/magic');
    }
});

app.delete('/logout', function(req, res) {
    // Destroys the session and logs the user out
    // Use req for logOut() function
    req.logOut();
    res.redirect('/login');
});

app.get('*', function(req,res) {
    res.render('error.ejs');
});

function checkAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        // Must give return for isAuthenticated
        return next();
    } else {
        res.redirect('/login');
    }
}

function checkNotAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
       return res.redirect('/admin');
    } 
    // When the middleware is used for multiple routes
    next();
}

server.listen(port, function(err){
    console.log("Chat App is live!");
}); 