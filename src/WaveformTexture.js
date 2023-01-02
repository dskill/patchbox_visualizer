import * as THREE from 'three';

export class WaveformTexture {
    height = 1;
    waveformRms = [0,0,0,0];
    waveformRmsAccum = [0,0,0,0];

    constructor(resolution = 512) {
        this.resolution = resolution;
        this.size = this.resolution * this.height;
        this.data = new Float32Array(4 * this.size);

        let color = new THREE.Color('red');
        let r = Math.floor(color.r * 255);
        let g = Math.floor(color.g * 255);
        let b = Math.floor(color.b * 255);
        let a = 255;
        this.texture = new THREE.DataTexture( this.data, this.resolution, this.height, THREE.RGBAFormat, THREE.FloatType);
        this.texture.encoding = THREE.LinearEncoding;

        this.waveformRms = [0,0,0,0];
        this.waveformRmsAccum = [0,0,0,0];
    
    }

    update( waveformArray0, waveformArray1 ) {
    // make an array that concatenates the waveform with itself
        // so that we can draw a line between the two

        // if waveformRmsAccum contains a NaN, set to 0
        // this is from NaN RMS values at startup
        if (isNaN(this.waveformRmsAccum[0])) {
            this.waveformRmsAccum = [0,0,0,0];
        } else if (isNaN(this.waveformRmsAccum[1])) {
            this.waveformRmsAccum = [0,0,0,0];
        }
        if (isNaN(this.waveformRms[0])) {
            this.waveformRms = [0,0,0,0];
        } else if (isNaN(this.waveformRms[1])) {
            this.waveformRms = [0,0,0,0];
        }
        
        for (let i = 0; i < this.resolution; i++)
        {
            // for FFT waveformArray[i * 4 + 1] = math.lerp(waveformArray[i * 4 + 1], Math.abs(waveformArray1[i]) * .02, 0.3);
            this.data[i * 4] = waveformArray0[i];
            this.data[i * 4 + 1] = waveformArray1[i];
            this.data[i * 4 + 2] = 0 // unused;
            this.data[i * 4 + 3] = 0 // unused;
               
            //RMS
            this.waveformRms[0] += this.data[i * 4]  * this.data[i * 4];
            this.waveformRms[1] += this.data[i * 4 + 1]  * this.data[i * 4 + 1];
            this.waveformRms[2] += this.data[i * 4 + 2]  * this.data[i * 4 + 2];
            this.waveformRms[3] += this.data[i * 4 + 3]  * this.data[i * 4 + 3];

        }

        this.waveformRms[0] =  Math.sqrt(this.waveformRms[0]/this.resolution);
        this.waveformRms[1] =  Math.sqrt(this.waveformRms[1]/this.resolution);
        this.waveformRms[2] =  Math.sqrt(this.waveformRms[2]/this.resolution);
        this.waveformRms[3] =  Math.sqrt(this.waveformRms[3]/this.resolution);

        this.waveformRmsAccum[0] += this.waveformRms[0] ;
        this.waveformRmsAccum[1] += this.waveformRms[1] ;
        this.waveformRmsAccum[2] += this.waveformRms[2] ;
        this.waveformRmsAccum[3] += this.waveformRms[3] ;
        this.texture.needsUpdate = true;
    }

    setResolution(resolution) {
        this.resolution = resolution;
        this.size = this.resolution * this.height;
        this.data = new Float32Array(4 * this.size);
        this.texture = new THREE.DataTexture( this.data, this.resolution, this.height, THREE.RGBAFormat, THREE.FloatType);
        this.texture.encoding = THREE.LinearEncoding;
    }
}