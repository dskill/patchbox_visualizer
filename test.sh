#!/bin/sh

#start the OSC server
node /home/patch/src/patchbox_visualizer/osc_server.js &
#start a webserver to serve the static webpage
http-server /home/patch/src/patchbox_visualizer/ &
#start the supercollider audio patch, which sends OSC data to the osc server
sclang /home/patch/src/patchbox_visualizer/main.scd &

#start chromium in kiosk mode. Point to our http-server port
xset -dpms     # disable DPMS (Energy Star) features.
xset s off     # disable screen saver
xset s noblank # don't blank the video device
# not toally sure what matchbox-window-manager does
# matchbox-window-manager -use_titlebar no &
unclutter &    # hide X mouse cursor unless mouse activated
#chromium-browser --display=:0 --kiosk --incognito --window-position=0,0 http://localhost:8080
/usr/bin/chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:8080
