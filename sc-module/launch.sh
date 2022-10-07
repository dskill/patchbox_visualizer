#!/bin/sh

# Copyright (C) 2017-2018 Vilniaus Blokas UAB, https://blokas.io/pisound
# All rights reserved.
#
# This software may be modified and distributed under the terms
# of the BSD license.  See the LICENSE file for details.
#
. /usr/local/pisound/scripts/common/common.sh

export XAUTHORITY=/home/patchbox/.Xauthority
export DISPLAY=:0.0
export JACK_NO_AUDIO_RESERVATION=1

# /usr/bin/jackd -P95 -dalsa -dhw:pisound -p128 -n2 -r48000
# jack seems to be already started from some other dependency?

export QT_QPA_PLATFORM="offscreen"

pactl unload-module module-jackdbus-detect
pactl unload-module module-jack-sink
pactl unload-module module-jack-source

# sclang /home/patch/Documents/scc/main.scd
#sclang /home/patch/src/patchbox_visualizer/main.scd

#start the OSC server
node /home/patch/src/patchbox_visualizer/osc_server.js &
#start a webserver to serve the static webpage
# Why doesn't this work? I get a strange "Update Required" error in chrome
# http-server /home/patch/src/patchbox_visualizer &
#start the supercollider audio patch, which sends OSC data to the osc server
sclang /home/patch/src/patchbox_visualizer/main.scd

#start chromium in kiosk mode. Point to our http-server port
#xset -dpms     # disable DPMS (Energy Star) features.
#xset s off     # disable screen saver
#xset s noblank # don't blank the video device
# not toally sure what matchbox-window-manager does
# matchbox-window-manager -use_titlebar no &
# unclutter &    # hide X mouse cursor unless mouse activated
#chromium-browser --display=:0 --kiosk --incognito --window-position=0,0 http:>
#/usr/bin/chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:8080


