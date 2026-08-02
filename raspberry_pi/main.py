import socketio
import uvicorn

sio = socketio.AsyncServer(cors_allowed_origins='*')
app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print("React Native Connected", sid)

@sio.event
async def frontend_command(sid, data):
    print("Received from React", data)
    await sio.emit('pi_response', {'status': 'Command executed', 'command': data.get('action')}, room=sid)

@sio.event
async def disconnect(sid):
    print("Client Disconnected", sid)

if __name__ == '__main__':
    print("Websocket Server Started Running on Port 3000")
    uvicorn.run(app, host="0.0.0.0", port=3000)