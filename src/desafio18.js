const express = require('express')
const morgan = require('morgan')
const handlebars = require('express-handlebars')  
const session = require('express-session')
const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongo')
const passport = require('passport')
const compression = require('compression')
var cors = require('cors')

const { logger, loggerError } = require('./logger/config')

require('dotenv').config()


const initListeners = require('./listeners')
const app = express()
app.use(compression())
app.use(cors())

const http = require('http').Server(app)
const io = require('socket.io')(http)

//-- Database Connection 
require('./config/db')

//-- Passport Config
require('./config/passport')(passport)

//-- Session y coookies 
app.use(session({
  store: MongoStore.create({ 
    mongoUrl: `${process.env.MONGO_ATLAS_URL}`,
    ttl: 60 * 10 
  }),
  secret: 'secreto',
  resave: true,
  saveUninitialized: true,
}))

app.use(morgan('dev'))

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//--Passport Middlewares 
app.use(passport.initialize())
app.use(passport.session())


//Public folder + Handlebars
app.use(express.static(__dirname + '/public'))
app.engine('hbs',handlebars({
  extname: '.hbs',
  layoutsDir: __dirname + '/views/layouts', 
}))
app.set('view engine','hbs')
app.set('views', __dirname + '/views');

// Rutas -
app.use('/',require('./routes/index'))
app.use('/productos',require('./routes/productos'))
app.use('/auth',require('./routes/auth'))

//Rutas API
app.use('/api/productos', require('./routes/api/productos'))
app.use('/api/auth', require('./routes/api/auth'))
 
//Socket
initListeners(io)

const PORT = process.env.PORT ||  8080


const server = http.listen(PORT, () => {
 logger.info(`servidor escuchando en http://localhost:${PORT} || PID ${process.pid}`, )
})

server.on('error', error => {
  loggerError.error('error en el servidor:', error)
})