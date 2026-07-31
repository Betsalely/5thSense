#include <SPI.h>
#include <DW3000.h>

int p1 = 9;
int p2 = 10;
int p3 = 11;
int p4 = 12;
int p5 = 13;
int p6 = 14;

struct BeaconData
{
    int id;
    float x;
    float y;
    float z;
    float d;
};

BeaconData b[8];
int b_cnt = 0;

struct PollPacket
{
    uint8_t type;
    uint8_t tid;
};

struct BeaconPacket
{
    uint8_t type;
    uint8_t bid;
    float x;
    float y;
    float z;
    uint32_t rt;
    uint32_t tt;
};

bool calc(float &ox, float &oy)
{
    if (b_cnt < 3)
        return false;

    float A[8][2];
    float B[8];

    int n = b_cnt - 1;
    float xn = b[n].x;
    float yn = b[n].y;
    float rn = b[n].d;

    for (int i = 0; i < n; i++)
    {
        A[i][0] = xn - b[i].x;
        A[i][1] = yn - b[i].y;
        B[i] = (b[i].d * b[i].d - rn * rn) - (b[i].x * b[i].x - xn * xn) - (b[i].y * b[i].y - yn * yn);
    }

    float AtA[2][2] = {0};
    float AtB[2] = {0};

    for (int i = 0; i < n; i++)
    {
        AtA[0][0] += A[i][0] * A[i][0];
        AtA[0][1] += A[i][0] * A[i][1];
        AtA[1][0] += A[i][1] * A[i][0];
        AtA[1][1] += A[i][1] * A[i][1];

        AtB[0] += A[i][0] * B[i];
        AtB[1] += A[i][1] * B[i];
    }

    float det = AtA[0][0] * AtA[1][1] - AtA[0][1] * AtA[1][0];
    if (det == 0)
        return false;

    ox = (AtA[1][1] * AtB[0] - AtA[0][1] * AtB[1]) / det;
    oy = (AtA[0][0] * AtB[1] - AtA[1][0] * AtB[0]) / det;

    return true;
}

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
    for (int id = 1; id <= 4; id++)
    {
        PollPacket p;
        p.type = 0x01;
        p.tid = id;

        int tx = DW3000::getSystemTime();
        DW3000::sendPacket((uint8_t *)&p, sizeof(p));

        while (!DW3000::receivePacket())
        {
        }

        uint8_t rx[64];
        uint16_t rxl = DW3000::getPacketLength();
        DW3000::getPacket(rx, rxl);

        BeaconPacket *res = (BeaconPacket *)rx;

        if (res->type == 0x02)
        {
            int rt = DW3000::getRxTimestamp();
            float tof = (rt - tx) * 15.65e-12;
            float dist = (tof * 299792458.0) / 2.0;

            b[b_cnt].id = id;
            b[b_cnt].x = res->x;
            b[b_cnt].y = res->y;
            b[b_cnt].z = res->z;
            b[b_cnt].d = dist;
            b_cnt++;
        }
    }

    float ax = 0, ay = 0;
    if (calc(ax, ay))
    {
        Serial.println(ax);
        Serial.println(ay);
    }
    delay(100);
}