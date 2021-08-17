#include <SoftwareSerial.h>;
SoftwareSerial device(10, 11);

void setup(){
  Serial.begin(115200);
  device.begin(115200);
}

void loop(){
  int i = Serial.available();
  while(i--){
    device.write(Serial.read());
  }
  int j = device.available();
  while(j--){
    Serial.write(device.read());
  }
}
