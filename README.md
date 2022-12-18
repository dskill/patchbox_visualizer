# Patchbox Visualizer
WIP guitar audio effects (with supercollider) and visuals (webgl).
Runs on desktop (mac/linux) but designed for patchbox OS on Raspberry PI.

## install
`npm install` 

## run with hot reloading
`npx canvas-sketch-cli --hot <your_sketch_here>.js`

## build static site
`canvas-sketch <your_sketch_here> --name index --build --inline`

## run server
`node server.js`

## Super Collider
files are in /sc
`sclang sc/...`

## kiosk.sh
`sh kiosk.sh` to startup chrome full screen kiosk mode

## Patchbox
`patchbox` to enter patchbox config
enable sc-module

