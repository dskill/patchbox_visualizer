
to autostart properly, run patchbox and enable the sc module. sc-module is in 
/usr/local/patchbox...

then also make sure the systemd kiosk.sh script has been started
sudo systemctl stop kiosk (enable/disable/start)

main.scd is the super collider script that will run

index.html is the webpage that will load
