#include <SPI.h>
#include <DW3000.h>

int p1 = 9;
int p2 = 10;
int p3 = 11;
int p4 = 12;
int p5 = 13;
int p6 = 14;

struct BeaconPacket
{
    uint8_t m;
    uint8_t id;
    float x;
    float y;
    float z;
    uint32_t rt;
    uint32_t tt;
};

void setup()
{
    Serial.begin(115200);
    SPI.begin();
    DW3000::select(p2);
    DW3000::begin(p6, p1);
    DW3000::setup();
    DW3000::setAntennaDelay(16384);
}

void loop()
{
    if (DW3000::receivePacket())
    {
        uint8_t buf[20];
        uint16_t len = DW3000::getPacketLength();
        DW3000::getPacket(buf, len);

        if (buf[0] == 0x01)
        {
            if (buf[1] == 1 || buf[1] == 0xFF)
            {
                BeaconPacket res;
                res.m = 0x02;
                res.id = 1;
                res.x = 0.00;
                res.y = 0.00;
                res.z = 1.50;

                DW3000::sendPacket((uint8_t *)&res, sizeof(res), true);
                Serial.println("sent");
            }
        }
    }
}