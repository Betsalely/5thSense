#include <SPI.h>
// #include <DW3000.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

#define PIN_RST 9
#define PIN_SS 10
#define PIN_MOSI 11
#define PIN_SCK 12
#define PIN_MISO 13
#define PIN_IRQ 14

#define I2C_SDA 8
#define I2C_SCL 9

#define MAX_BEACONS 8
#define SPEED_OF_LIGHT 299792458.0

Adafruit_MPU6050 mpu;

float prev_x = 0;
float prev_y = 0;
unsigned long prev_time = 0;

struct BeaconData
{
    uint8_t id;
    float x;
    float y;
    float z;
    float distance;
    bool updated;
};

BeaconData beacons[MAX_BEACONS];
uint8_t beacon_count = 0;

struct __attribute__((packed)) PollPacket
{
    uint8_t msg_type;
    uint8_t target_id;
};

struct __attribute__((packed)) BeaconPacket
{
    uint8_t msg_type;
    uint8_t beacon_id;
    float x;
    float y;
    float z;
    uint32_t rx_timestamp;
    uint32_t tx_timestamp;
};

float sim_angle = 0.0;

void generateFakeBeaconData()
{
    sim_angle += 0.1;
    float sim_x = 5.0 + 3.0 * cos(sim_angle);
    float sim_y = 5.0 + 3.0 * sin(sim_angle);

    float anchors[3][2] = {{0.0, 0.0}, {10.0, 0.0}, {0.0, 10.0}};

    beacon_count = 3;
    for (int i = 0; i < 3; i++)
    {
        beacons[i].id = i + 1;
        beacons[i].x = anchors[i][0];
        beacons[i].y = anchors[i][1];
        beacons[i].z = 0.0;

        float dx = sim_x - anchors[i][0];
        float dy = sim_y - anchors[i][1];
        beacons[i].distance = sqrt(dx * dx + dy * dy);
        beacons[i].updated = true;
    }
}

bool calculateAnchorPosition(float &out_x, float &out_y)
{
    int valid_beacons = 0;
    for (int i = 0; i < beacon_count; i++)
    {
        if (beacons[i].updated)
            valid_beacons++;
    }

    if (valid_beacons < 3)
        return false;

    float A[MAX_BEACONS][2];
    float B[MAX_BEACONS];

    int ref_idx = valid_beacons - 1;
    float xN = beacons[ref_idx].x;
    float yN = beacons[ref_idx].y;
    float rN = beacons[ref_idx].distance;

    int row = 0;
    for (int i = 0; i < valid_beacons - 1; i++)
    {
        float xi = beacons[i].x;
        float yi = beacons[i].y;
        float ri = beacons[i].distance;

        A[row][0] = 2 * (xN - xi);
        A[row][1] = 2 * (yN - yi);
        B[row] = (ri * ri - rN * rN) - (xi * xi - xN * xN) - (yi * yi - yN * yN);
        row++;
    }

    float AtA[2][2] = {0};
    float AtB[2] = {0};

    for (int i = 0; i < row; i++)
    {
        AtA[0][0] += A[i][0] * A[i][0];
        AtA[0][1] += A[i][0] * A[i][1];
        AtA[1][0] += A[i][1] * A[i][0];
        AtA[1][1] += A[i][1] * A[i][1];

        AtB[0] += A[i][0] * B[i];
        AtB[1] += A[i][1] * B[i];
    }

    float det = AtA[0][0] * AtA[1][1] - AtA[0][1] * AtA[1][0];
    if (abs(det) < 0.0001)
        return false;

    out_x = (AtA[1][1] * AtB[0] - AtA[0][1] * AtB[1]) / det;
    out_y = (AtA[0][0] * AtB[1] - AtA[1][0] * AtB[0]) / det;

    return true;
}

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println("Starting Mobile Anchor Beacon with IMU (USB Serial)...");

    Wire.begin(I2C_SDA, I2C_SCL);
    if (!mpu.begin())
    {
        Serial.println("Failed to find MPU6050 chip! Check wiring.");
    }
    else
    {
        Serial.println("MPU6050 Found!");
        mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
        mpu.setGyroRange(MPU6050_RANGE_500_DEG);
        mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    }

    // SPI.begin(PIN_SCK, PIN_MISO, PIN_MOSI, PIN_SS);
    // DW3000::select(PIN_SS);
    // if (!DW3000::begin(PIN_IRQ, PIN_RST))
    // {
    //     Serial.println("DWM3000 initialization failed!");
    //     while (1)
    //         ;
    // }
    // DW3000::setup();
    // DW3000::setAntennaDelay(16384);
}

void loop()
{
    generateFakeBeaconData();

    // for (uint8_t id = 1; id <= 4; id++)
    // {
    //     PollPacket poll;
    //     poll.msg_type = 0x01;
    //     poll.target_id = id;
    //
    //     uint64_t poll_tx_ts = DW3000::getSystemTime();
    //     DW3000::sendPacket((uint8_t *)&poll, sizeof(poll));
    //
    //     unsigned long start_time = millis();
    //     while (millis() - start_time < 20)
    //     {
    //         if (DW3000::receivePacket())
    //         {
    //             uint8_t rx_buffer[64];
    //             uint16_t rx_len = DW3000::getPacketLength();
    //             DW3000::getPacket(rx_buffer, rx_len);
    //
    //             if (rx_len == sizeof(BeaconPacket))
    //             {
    //                 BeaconPacket *resp = (BeaconPacket *)rx_buffer;
    //
    //                 if (resp->msg_type == 0x02 && resp->beacon_id == id)
    //                 {
    //                     uint64_t resp_rx_ts = DW3000::getRxTimestamp();
    //
    //                     double tof = (double)(resp_rx_ts - poll_tx_ts) * DW3000_TIME_UNITS;
    //                     float distance = (tof * SPEED_OF_LIGHT) / 2.0;
    //
    //                     bool found = false;
    //                     for (int i = 0; i < beacon_count; i++)
    //                     {
    //                         if (beacons[i].id == id)
    //                         {
    //                             beacons[i].x = resp->x;
    //                             beacons[i].y = resp->y;
    //                             beacons[i].z = resp->z;
    //                             beacons[i].distance = distance;
    //                             beacons[i].updated = true;
    //                             found = true;
    //                             break;
    //                         }
    //                     }
    //
    //                     if (!found && beacon_count < MAX_BEACONS)
    //                     {
    //                         beacons[beacon_count] = {id, resp->x, resp->y, resp->z, distance, true};
    //                         beacon_count++;
    //                     }
    //                     break;
    //                 }
    //             }
    //         }
    //     }
    //     delay(10);
    // }

    float anchor_x = 0, anchor_y = 0;
    if (calculateAnchorPosition(anchor_x, anchor_y))
    {
        unsigned long current_time = millis();
        float dt = (current_time - prev_time) / 1000.0;
        float velocity = 0.0;

        if (dt > 0 && prev_time != 0)
        {
            float dx = anchor_x - prev_x;
            float dy = anchor_y - prev_y;
            velocity = sqrt(dx * dx + dy * dy) / dt;
        }

        prev_x = anchor_x;
        prev_y = anchor_y;
        prev_time = current_time;

        sensors_event_t a, g, temp;
        mpu.getEvent(&a, &g, &temp);

        String payload = "{\"x\":" + String(anchor_x, 2) +
                         ",\"y\":" + String(anchor_y, 2) +
                         ",\"v\":" + String(velocity, 2) +
                         ",\"ax\":" + String(a.acceleration.x, 2) +
                         ",\"ay\":" + String(a.acceleration.y, 2) +
                         ",\"az\":" + String(a.acceleration.z, 2) + "}";

        Serial.println(payload);
    }

    delay(100);
}