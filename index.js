import express from 'express'
import logger from 'morgan'

import { Server } from 'socket.io'
import { createServer } from 'node:http'



const app = express();
const port = process.env.PORT ?? 3000
//Juntar todo en un solo server
const server = createServer(app)
const io = new Server(server, {
    connectionStateRecovery: {}
})

io.on('connection', (socket) => {
    console.log('user has connected')

    socket.on('disconnect', () => {
        console.log('User has disconnected')
    })

    socket.on('chat message' , (msg) =>{
        console.log(msg)
        io.emit('chat message', msg)
    })
})

app.use(logger())

app.get('/', (req, res) => {
    res.sendFile(process.cwd() +'/client/index.html')
});

server.listen(port , 
    console.log("server on port " + port)
)