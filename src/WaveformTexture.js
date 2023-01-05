import * as THREE from 'three';

export class WaveformTexture {
    height = 1;
    waveformRms = [0,0,0,0];
    waveformRmsAccum = [0,0,0,0];

    constructor(resolution = 512) {
        this.resolution = resolution;
        const size = this.resolution * this.height;
        const data = new Float32Array(4 * size);

        let color = new THREE.Color('red');
        let r = Math.floor(color.r * 255);
        let g = Math.floor(color.g * 255);
        let b = Math.floor(color.b * 255);
        let a = 255;
        this.texture = new THREE.DataTexture( data, this.resolution, this.height, THREE.RGBAFormat, THREE.FloatType);
        this.texture.encoding = THREE.LinearEncoding;

        this.waveformRms = [0,0,0,0];
        this.waveformRmsAccum = [0,0,0,0];
    
    }

    update( waveformArray0, waveformArray1 ) {
        const size = this.texture.image.width * this.texture.image.height;
		const data = this.texture.image.data;

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
        for (let i = 0; i < size; i++)
        {
            // for FFT waveformArray[i * 4 + 1] = math.lerp(waveformArray[i * 4 + 1], Math.abs(waveformArray1[i]) * .02, 0.3);
            data[i * 4] = waveformArray0[i];
            data[i * 4 + 1] = waveformArray1[i];
            data[i * 4 + 2] = 0 // unused;
            data[i * 4 + 3] = 0 // unused;
               
            //RMS
            this.waveformRms[0] += data[i * 4]  * data[i * 4];
            this.waveformRms[1] += data[i * 4 + 1]  * data[i * 4 + 1];
            this.waveformRms[2] += data[i * 4 + 2]  * data[i * 4 + 2];
            this.waveformRms[3] += data[i * 4 + 3]  * data[i * 4 + 3];

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
        console.log ('setting waveform texture resolution to ' + resolution)
        this.resolution = resolution;
        const size = this.resolution * this.height;
        const data = new Float32Array(4 * size);
        this.texture.dispose();
        this.texture = new THREE.DataTexture( data, this.resolution, this.height, THREE.RGBAFormat, THREE.FloatType);
        this.texture.encoding = THREE.LinearEncoding;
    }
}