#include <SPI.h>
#include <DW3000.h>

#define PIN_RST 9
#define PIN_SS 10
#define PIN_MOSI 11
#define PIN_SCK 12
#define PIN_MISO 13
#define PIN_IRQ 14

const uint8_t BEACON_ID = 1;
const float BEACON_X = 0.00;
const float BEACON_Y = 0.00;
const float BEACON_Z = 1.50;

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

void setup()
{
    Serial.begin(115200);
    delay(1000);
    Serial.printf("Starting Emitting Beacon #%d at (%.2f, %.2f, %.2f)\n", BEACON_ID, BEACON_X, BEACON_Y, BEACON_Z);

    SPI.begin(PIN_SCK, PIN_MISO, PIN_MOSI, PIN_SS);

    DW3000::select(PIN_SS);
    if (!DW3000::begin(PIN_IRQ, PIN_RST))
    {
        Serial.println("DWM3000 initialization failed!");
        while (1)
            ;
    }

    DW3000::setup();
    DW3000::setAntennaDelay(16384);
}

void loop()
{
    if (DW3000::receivePacket())
    {
        uint8_t rx_buffer[64];
        uint16_t rx_len = DW3000::getPacketLength();
        DW3000::getPacket(rx_buffer, rx_len);

        if (rx_len > 0 && rx_buffer[0] == 0x01)
        {
            uint8_t target_id = rx_buffer[1];

            if (target_id == BEACON_ID || target_id == 0xFF)
            {
                uint64_t poll_rx_ts = DW3000::getRxTimestamp();

                BeaconPacket response;
                response.msg_type = 0x02;
                response.beacon_id = BEACON_ID;
                response.x = BEACON_X;
                response.y = BEACON_Y;
                response.z = BEACON_Z;

                uint64_t resp_tx_ts = poll_rx_ts + DW3000::usToUwbTime(2000);
                DW3000::setTxTimestamp(resp_tx_ts);

                DW3000::sendPacket((uint8_t *)&response, sizeof(response), true);
                Serial.printf("Responded to Anchor query with coords (%.2f, %.2f)\n", BEACON_X, BEACON_Y);
            }
        }
    }
}