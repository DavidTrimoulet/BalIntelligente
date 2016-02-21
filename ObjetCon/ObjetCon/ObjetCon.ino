#include <Wire.h>
#include <SPI.h>
#include <Adafruit_PN532.h>
#include <Servo.h>
#define PN532_IRQ   (2)
#define PN532_RESET (3)  // Not connected by default on the NFC Shield
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);
#include <SoftwareSerial.h>
#define RX_PIN 5
#define TX_PIN 4
SoftwareSerial sigfox(RX_PIN,TX_PIN);

Servo serrure;
#define servoPort 9
unsigned long time = 0; 

//0 if closed or 1 if open
byte doorState = 1;

//Envoie du message Sigfox et lecture du retour.
void sendMessage(char message[]){
      sigfox.write(message);
      while (sigfox.available()){
        Serial.write(sigfox.read());
      }      
}

void openDoor(){
  //Si la porte est ouverte
  if(!doorState){
    //Fermeture de la serrure
    serrure.write(90);
    doorState = 1;
    delay(1000);
    sendMessage("AT$SF=6f 70 65 6e\r");
  }else{
    //Ouverture de la serrure
    serrure.write(0);
    doorState = 0;
    delay(1000);
    sendMessage("AT$SF=63 6c 6f 73 65\r");
  } 
}

void setup() { 
  //Serial.begin(115200);
  nfc.begin();
  nfc.SAMConfig();
  pinMode(A0,INPUT);
  serrure.attach(servoPort);
  openDoor();
  sigfox.begin(9600);
}

void loop() {
  //Id de la carte à remplacer par un code ecrit sur la carte
  uint8_t pass[] = {129, 110, 86, 35};
  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };  // Buffer to store the returned UID
  uint8_t uidLength;                        // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
  
  //test si on coupe l'IR et à quelle hauteur
  int distance = analogRead(A0);
  //Serial.print("distance :"); Serial.println(distance);
  //Si on le coupe à hauteur du courrier
  if(distance > 400 && doorState){
      //Envoie du message "mail"
      sendMessage("AT$SF=6d 61 69 6c\r");
  }
  //si on le coupe à hauteur de la Pub
  else if{distance > 300 && doorState){
      //Envoie du message "pub"
      sendMessage("AT$SF=70 75 62\r");
  }  
  
  //Lecture du capteur NFC avec un timeout toute les 500 miliseconde pour permettre la lecture de l'IR
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 500);
  //Si on capte la carte, et que c'est la bonne, on ouvre ou on ferme en fonction de l'état.
  if(success){
    if(!memcmp(pass, uid, 4)){
      openDoor();
    }
  }
}
