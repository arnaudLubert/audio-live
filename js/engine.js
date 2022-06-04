const canv = document.getElementById('canvas', {alpha: false});
const canvas = canv.getContext('2d');

let config = {
    width: canv.width = canv.clientWidth * 2,
    height: canv.height = canv.clientHeight * 2,
    bufferSize: 0,
    audioDataLength: 0,
    bpm: 120,
    run: true,
};

const FFT_SIZE = 256; // [32-2048]
const SMOOTH_DELAY = 300; // ms
const KICK_FREQ_POSITION = 1;
const BPM_THRESHOLD = 0.7; // [0-1]
const BPM_RANGE = [120, 160];
const BPM_SAMPLE_SIZE = 1000; // ms
const DEFAULT_KICK_SAMPLE_ARR_SIZE = 200;
const LIMIT_HIGH = 0.85;
const LIMIT_BASS = 0.3;
/*
155 BPM = 387ms
140 BPM = 428ms
130 BPM = 461ms
120 BPM = 500ms
110 BPM = 545ms
100 BPM = 600ms
 90 BPM = 667ms
*/

canv.width = config.width;
canv.height = config.height;
let lastFrame = new Date();

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
navigator.getUserMedia({ video : false, audio : true }, initRecord, console.log);
// center = [canv.width / 2 + displayData.position[0], canv.height / 2 + displayData.position[1]];

let analyser, smoothAudioData, rawAudioData, normalizedAudioData;
let splitFreqs = new Array(6);

function initRecord(stream) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const mic = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();

    mic.connect(analyser);

    analyser.fftSize = FFT_SIZE;
    rawAudioData = new Uint8Array(analyser.frequencyBinCount);
    normalizedAudioData = new Float32Array(analyser.frequencyBinCount);
    smoothAudioData = new Float32Array(analyser.frequencyBinCount);
    config.audioDataLength = Math.round(rawAudioData.length * 0.8)

    loop();
}

function loop() {
    analyser.getByteFrequencyData(rawAudioData);
    normalizeData();
    const now = new Date();
    smoothData(now);
    splitFreqAverage();
    storeBPM(now);

    // drawVisualizer();
    draw();

    if (config.run)
        requestAnimationFrame(loop);
}

function draw() {
    canvas.clearRect(0, 0, config.width, config.height);

    canvas.fillStyle = 'white';
    canvas.strokeStyle = 'white';
    canvas.lineWidth = 4;
    drawLine(0.5, 0.5, 0.8, 0.25);
    //drawUHW(0.5, 0.5, 0.5, 0.5, 0);
//    drawRect(0.5, 0.5, 0.8, 0.25, 0);
    //drawTriangle(0.5, 0.5, 0.25, 0.25, 0.25);
    //drawPath([{x: 0.2, y: 0.2}, {x: 0.5, y: 0.1}, {x: 0.8, y: 0.5}, {x: 0.5, y: 0.8}, {x: 0.2, y: 0.6}]);
//    drawRect(0.5, 0.5, 0.8, 0.25, 0);
//    drawLineVisuilizer(smoothAudioData, 0.5, 0.5, 1, 0.25, 0.25, Math.round(config.audioDataLength / 4), Math.round(config.audioDataLength / 2), true);
//    drawLineVisuilizer(smoothAudioData, 0.5, 0.5, 1, 0.25, 0.75, Math.round(config.audioDataLength / 4), Math.round(config.audioDataLength / 2), false);

    //drawLineVisuilizer(smoothAudioData, 0.65, 0.5, 1, 0.20, 0.25, Math.round(config.audioDataLength / 4), Math.round(config.audioDataLength / 2));
    //drawLineVisuilizer(smoothAudioData, 0.35, 0.5, 1, 0.20, 0.75, Math.round(config.audioDataLength / 4), Math.round(config.audioDataLength / 2));
}

function drawVisualizer() {
    canvas.clearRect(0, 0, config.width, config.height);

    const barSize = config.width / config.audioDataLength;

    canvas.fillStyle = 'orange';
    canvas.beginPath();

    for (let i = config.audioDataLength - 1; i !== -1; i--) {
        canvas.fillRect(barSize * i, 0, barSize, smoothAudioData[i] * config.height);
    }
    canvas.closePath();
}

function normalizeData() {
    let value, coeff;

    for (let i = config.audioDataLength - 1; i !== -1; i--) {
        coeff = (i > config.audioDataLength * LIMIT_HIGH) ? 3.2 : (i > config.audioDataLength * 0.05) ? 2 : 1;
        value = rawAudioData[i] + rawAudioData[i] * coeff / config.audioDataLength * i;
        normalizedAudioData[i] = (value > 256) ? 1.0 : value / 256;
        smoothAudioData[i] = normalizedAudioData[i];
    }
}

function smoothData(now) {
    let value;
    const decreaseStep = (now - lastFrame) / SMOOTH_DELAY;

    for (let i = config.audioDataLength - 1; i !== -1; i--) {
        if (normalizedAudioData[i] > smoothAudioData[i])
            smoothAudioData[i] = normalizedAudioData[i];
        else {
            value = smoothAudioData[i] - decreaseStep;
            smoothAudioData[i] = (value < 0) ? 0 : value;
        }
    }
    lastFrame = now;
}

function splitFreqAverage() {
    const prelimits = [Math.round(config.audioDataLength * LIMIT_BASS), Math.round(config.audioDataLength * LIMIT_HIGH), config.audioDataLength];
    const limits = [Math.round(prelimits[0] / 2), prelimits[0], Math.round(prelimits[0] + (prelimits[1] - prelimits[0]) / 2), prelimits[1], Math.round(prelimits[1] + (prelimits[2] - prelimits[1]) / 2), prelimits[2]];
    const counts = [limits[0], limits[1] - limits[0], limits[2] - limits[1], limits[3] - limits[2], limits[4] - limits[3], limits[5] - limits[4]];
    let j = 0;
    let i = 0;

    while (j !== 6) {
        splitFreqs[j] = 0;

        while (i !== limits[j]) {
            splitFreqs[j] += smoothAudioData[i];
            i++;
        }
        splitFreqs[j] /= counts[j];
        j++;
    }
}

let sampleKickPosition = 0;
let sampleKick = new Array(DEFAULT_KICK_SAMPLE_ARR_SIZE);
let sampleKickTime = new Array(DEFAULT_KICK_SAMPLE_ARR_SIZE);
let lastBPM = new Float32Array(16);
let lastBPMposition = 0;
let kickSampleArrSize = DEFAULT_KICK_SAMPLE_ARR_SIZE;

function storeBPM(now) {
    if (sampleKickPosition === kickSampleArrSize) {
        sampleKickPosition = 0;
        kickSampleArrSize *= 1.5;
        sampleKick = new Array(kickSampleArrSize);
        sampleKickTime = new Array(kickSampleArrSize);
        console.error('Adjusting kickSampleArrSize...');
        return;
    } else if (now - sampleKickTime[0] > BPM_SAMPLE_SIZE) {
        // drawSampleKickArray();
        computeBPM();
        sampleKickPosition = 0;
    }
    sampleKick[sampleKickPosition] = normalizedAudioData[KICK_FREQ_POSITION];
    sampleKickTime[sampleKickPosition] = now;
    sampleKickPosition++;
}

function computeBPM() {
    let min = 1.0;
    let max = 0.0;

    for (let i = 0; i !== sampleKickPosition; i++) {
        if (sampleKick[i] < min)
            min = sampleKick[i];
        if (sampleKick[i] > max)
            max = sampleKick[i];
    }
    const thresholdValue = (max - min) / 2 * BPM_THRESHOLD;
    const threshold = [min + thresholdValue, max - thresholdValue];
    let inThreshold = sampleKick[0] > threshold[1];
    let step = 0;

    max1 = kickSampleArrSize - 1;
    max2 = kickSampleArrSize - 1;
    sampleKick[max1] = 0.0;

    for (let i = 0; i !== sampleKickPosition; i++) {
        if (inThreshold) {
            if (sampleKick[i] < threshold[1])
                inThreshold = false;
        } else {
            if (step === 0 && sampleKick[i] > threshold[1]) {
                step = 1;
            } else if (step === 2 && sampleKick[i] > threshold[1]) {
                step = 3;
            }

            if (step === 1) {
                if (sampleKick[i] < threshold[1]) {
                    step = 2;
                } else if (sampleKick[i] > sampleKick[max1])
                    max1 = i;
            } else if (step === 3) {
                if (sampleKick[i] < threshold[1]) {
                    break;
                    if (wentDown) {
                        const bpm = 1000 / Math.abs(sampleKickTime[max1] - sampleKickTime[max2]) * 60;

                        if (bpm < BPM_RANGE[1]) {
                            break;
                        } else {
                            step = 1;
                            max2 = kickSampleArrSize - 1;
                        }
                    }
                    way = 0;
                } else if (sampleKick[i] > sampleKick[max2]) {
                    max2 = i;
                }
            }
        }
    }

    if (max1 !== kickSampleArrSize - 1 && max2 !== kickSampleArrSize - 1) {
        const bpm = 1000 / Math.abs(sampleKickTime[max1] - sampleKickTime[max2]) * 60;

        if (bpm < BPM_RANGE[0] || bpm > BPM_RANGE[1])
            return;
        lastBPM[lastBPMposition] = bpm;
        lastBPMposition++;
        if (lastBPMposition === lastBPM.length)
            lastBPMposition = 0;

        let total = 0;
        let count = 0;

        for (let i = lastBPM.length - 1; i !== -1; i--) {
            if (lastBPM[i] !== 0) {
                total += lastBPM[i];
                count++;
            }
        }

        config.bpm = total / count;
    }
}

function drawSampleKickArray() {
    canvas.clearRect(0, 0, config.width, config.height);

    const barSize = config.width / sampleKickPosition;

    canvas.fillStyle = 'blue';
    canvas.beginPath();

    for (let i = 0; i !== sampleKickPosition; i++) {
        canvas.fillRect(barSize * i, 0, barSize, sampleKick[i] * config.height);
    }
    canvas.closePath();
}

function stopLoop() {
    document.getElementById('stop').style.display = 'none';
    config.run = false;
}
