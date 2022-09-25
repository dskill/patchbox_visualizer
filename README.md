# websocket-sketches
playing with websockets AND @mattdesl's canvas-sketch tool.

websockets need to be configured to talk to a local nodejs server

## install
`npm install` 

## run with hot reloading
`npx canvas-sketch-cli --hot <your_sketch_here>.js`

## build static site
`canvas-sketch <your_sketch_here> --name index --build --inline`

here's how to build to a inlined html file.  Note that it doesn't bring along static files (assets/blah.mp3) for example
so you may have to move those where they belong
`npx canvas-sketch-cli wavejump.js --build --name index --inline`

## an easy way to deploy static site
`npm install surge`
`surge --domain muddled-committee.surge.sh`

# Server
From NativeWebSocket unity plugin
https://github.com/endel/NativeWebSocket

`npm start` to launch the server