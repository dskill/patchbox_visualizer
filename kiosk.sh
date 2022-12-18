#!/bin/bash

MY_IP=$(ip addr show eth0 | grep -Po 'inet \K[\d.]+')

xset s noblank
xset s off
xset -dpms

unclutter -idle 0.1 -root &

sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /home/$USER/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' /home/$USER/.config/chromium/Default/Preferences

git pull
npm install
node server.js &
sclang sc/main.scd &
/usr/bin/chromium-browser --noerrdialogs --disable-cursor-lock-for-test --disable-infobars --kiosk http://$MY_IP:3000/?gui
