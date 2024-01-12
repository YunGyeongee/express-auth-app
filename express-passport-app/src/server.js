const cookieSession = require('cookie-session')
const express = require('express')
const { default: mongoose} = require('mongoose')
const passport = require('passport')
const path = require('path')
const User = require("./models/users.model")
const app = express()

const cookieEncryptionKey = 'secret-key'

app.use(cookieSession({
    keys: [cookieEncryptionKey]
}))

// app.use(function (req, res, next) {
//     if (req.session && !req.session.regenerate) {
//         req.session.regenerate = (cb) => cb()
//     }
//
//     if (req.session && !req.session.save) {
//         req.session.save = (cb) => cb()
//     }
// })

app.use(passport.initialize())
app.use(passport.session())
require('./config/passport')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

mongoose.set('strictQuery', false)
mongoose.connect(`mongodb+srv://<user>:<password>@freeapp.vl7ilvo.mongodb.net/`)
    .then(() => {
        console.log('mongodb connected')
    })
    .catch((err) => {
        console.log(err)
    })
app.use('/static', express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.render('index')
})
app.get('/login', (req, res) => {
    res.render('login')
})
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
       if (err) {
           return next(err)
       }

       if (!user) {
           console.log('user not found')
           return res.json({ msg: info })
       }

       req.logIn(user, function (err) {
           if (err) { return next(err) }
           res.redirect('/')
       })
   }) (req, res, next)
})

app.get('/signup', (req, res) => {
    res.render('signup')
})
app.post('/signup', async (req, res) => {
    // user 객체 생성
    const user = new User(req.body)

    try {
        // user 컬렉션에 유저를 저장
        await user.save()
        return res.status(200).json({
            success: true
        })
    } catch (error) {
        console.log(error)
    }
})

const port = 4000;
app.listen(port, () => {
    console.log(`Listening on ${port}`)
})