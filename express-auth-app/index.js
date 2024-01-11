const cookieParser = require('cookie-parser')
const express = require('express')
const jwt = require('jsonwebtoken')

const app = express()
const secretText = 'secret'
const refreshText = 'refresh'

const posts = [
    {
        username: 'John',
        title: 'title 1'
    },
    {
        username: 'Han',
        title: 'title 2'
    },
]
let refreshTokens = []

app.use(express.json())
app.use(cookieParser())
app.get('/', (req, res) => {
    res.send('hi')
})

// 인증 토큰 생성하기
app.post('/login', (req, res) => {
    const username = req.body.username
    const user = { name: username }

    // jwt를 이용해서 토큰 생성하기 => payload + secretText
    const accessToken = jwt.sign(user, secretText, { expiresIn: '30s' })

    // jwt를 이용해서 refreshToken 생성
    const refreshToken = jwt.sign(user, refreshText, {expiresIn: '1d'})
    refreshTokens.push(refreshToken)

    // refreshToken 을 쿠키에 넣어주기
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    })
    res.json({ accessToken: accessToken })
})

app.get('/refresh', (req, res) => {
    // body => parsing => req.body
    // cookies => parsing => req.cookies

    // cookies 가져오기 cookie-parser
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(401)

    const refreshToken = cookies.jwt
    // refreshToken 이 데이터베이스에 있는 토큰인지 확인
    if (!refreshToken.includes(refreshToken)) {
        return res.sendStatus(403)
    }

    // token 이 유효한 토큰인지 확인
    jwt.verify(refreshToken, refreshText, (err, user) => {
        if (err) return res.sendStatus(403)

        // accessToken 생성
        const accessToken = jwt.sign({ name: user.name },
            secretText,
            { expiresIn: '30s' }
        )
        res.json({ accessToken })
    })
})

// 인증 없이 가져오기
app.get('/posts', authMiddleware, (req, res) => {
    res.json(posts)
})

// 인증 미들웨어 생성
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)

    // 토큰이 유효한 토큰인지 확인
    jwt.verify(token, secretText, (err, user) => {
        console.log(err)
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}


const port = 4000
app.listen(port, () => {
    console.log('listening on port ' + port)
})