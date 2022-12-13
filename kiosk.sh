#!/bin/bash
xset s noblank
xset s off
xset -dpms

unclutter -idle 0.0 -root &

sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /home/$USER/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' /home/$USER/.config/chromium/Default/Preferences

http-server /home/patch/src/patchbox_visualizer &
#TODO: Make the IP generated when this script starts
/usr/bin/chromium-browser --noerrdialogs --disable-cursor-lock-for-test --disable-infobars --kiosk http://192.168.50.241:3000/?gui
