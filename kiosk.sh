#!/bin/bash

echo "Starting Patchbox Visualizer..." > /home/patch/logs/pv_startup.log

# Loop until MY_IP is not null
# this waits for the WIFI network to be up
#while [ -z "$MY_IP" ]; do
#  MY_IP=$(ip addr show wlan0 | grep -Po 'inet \K[\d.]+')
#  echo "Detected IP: $MY_IP" >> /home/patch/logs/pv_startup.log
#  sleep 1
#done
MY_IP = 'localhost'

xset s noblank
xset s off
xset -dpms

# unclutter -idle 0.1 -root &

sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /home/$USER/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' /home/$USER/.config/chromium/Default/Preferences

cd /home/patch/src/patchbox_visualizer
pwd >> /home/patch/logs/pv_startup.log

git pull # get the latest code
npm install # hacky way to make sure we have the latest dependencies
node /home/patch/src/patchbox_visualizer/server.js &> /home/patch/logs/server.log & # node server and OSC bridge
sclang /home/patch/src/patchbox_visualizer/sc/main.scd &> /home/patch/logs/supercollider.log & # super collider
#/usr/bin/chromium-browser --noerrdialogs --disable-cursor-lock-for-test --disable-infobars --kiosk http://$MY_IP:3000 # web broweser
/usr/bin/chromium-browser --noerrdialogs --disable-cursor-lock-for-test --disable-infobars --kiosk "http://$MY_IP:3000/?gui&init_with_precip&allow_touch"