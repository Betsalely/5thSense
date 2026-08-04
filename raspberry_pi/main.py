import socketio
import uvicorn
import random

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = socketio.ASGIApp(sio)

def generate_fake_esp32_data():
    return [
        {
            "x": round(random.uniform(0, 100), 2), 
            "y": round(random.uniform(0, 100), 2), 
            "v": round(random.uniform(0, 50), 2)
        }
        for _ in range(3)
    ]

@sio.event
async def connect(sid, environ):
    print("Frontend Connected:", sid)

@sio.event
async def request_data(sid, data):
    print("Data requested by:", sid)
    fake_data = generate_fake_esp32_data()
    await sio.emit('esp32_data', fake_data, room=sid)

@sio.event
async def frontend_command(sid, data):
    print("Received from Frontend:", data)
    await sio.emit('pi_response', {'status': 'Command executed', 'command': data.get('action')}, room=sid)

@sio.event
async def disconnect(sid):
    print("Client Disconnected:", sid)

if __name__ == '__main__':
    print("WebSocket Server Started Running on Port 3000")
    uvicorn.run(app, host="0.0.0.0", port=3000)

