const canv = document.getElementById('canvas', {alpha: false});
const canvas = canv.getContext('2d');

let config = {
    width: canv.width = canv.clientWidth * 2,
    height: canv.height = canv.clientHeight * 2,
    bufferSize: 0,
    audioDataLength: 0,
    bpm: 120,
    bpmResetting: false,
    run: true,
};

const BPM_RANGE = [120, 160];
const DEFAULT_FRAME_RATE = 75;

const FFT_SIZE = 256; // [32-2048]
const SMOOTH_DELAY = 300; // ms
const KICK_FREQ_POSITION = 1;
const BPM_THRESHOLD = 0.7; // [0-1]
const MINIMIM_KICK_INTENSITY = 0.25; // [0-1]
const BPM_SAMPLE_LOOPS = 16; // Kicks count
const BPM_SAMPLE_SIZE = 60000 / BPM_RANGE[0] * (BPM_SAMPLE_LOOPS + 2); // ms
const DEFAULT_KICK_SAMPLE_ARR_SIZE = Math.round((DEFAULT_FRAME_RATE + 1) * BPM_SAMPLE_SIZE / 1000);
const LIMIT_HIGH_NORM = 0.85;
const LIMIT_HIGH = 0.65;
const LIMIT_BASS = 0.2;
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
canvas.lineWidth = 4;
canvas.font = '48px monospace';
canvas.textAlign = 'center';

const rawStorage = localStorage.getItem('scenes');
const scenes = rawStorage ? JSON.parse(rawStorage) : [];

let animationProgress = 0.0;
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
    incrementAnimationProgress();
}

function loop() {
    analyser.getByteFrequencyData(rawAudioData);
    normalizeData();
    const now = new Date();

    smoothData(now);
    splitFreqAverage();
    computeBPM(now);

//     drawVisualizer();
//    draw();

    if (config.run)
        requestAnimationFrame(loop);
}
let scene = scenes[4];

function draw() {
    canvas.clearRect(0, 0, config.width, config.height);

    if (scenes.length === 0) {
        canvas.fillStyle = 'white';
        canvas.fillText('0 scenes found.', config.width / 2, config.height / 2);
    }
    let audioData = smoothAudioData;
    let position, size, angle, frameValue, opacity, color;

    for (let i = 0; i !== scene.objects.length; i++) {
        if (scene.objects[i].animation.activation === 1)
            frameValue = 0.0;
        else {
            if (scene.objects[i].animation.activation > 1)
                frameValue = splitFreqs[scene.objects[i].animation.activation - 2];
            else {
                switch (scene.objects[i].animation.loop) {
                    case 0:
                        frameValue = animationProgress % 1.0;
                        break;
                    case 1:
                        frameValue = animationProgress % 2.0 / 2;
                        break;
                    case 2:
                        frameValue = animationProgress % 2 < 1.0 ? animationProgress % 2 : 2 - animationProgress % 2;
                        break;
                    case 3:
                        frameValue = animationProgress / 4;
                        break;
                    case 4:
                        frameValue = (animationProgress < 2.0 ? animationProgress : 4 - animationProgress) / 2;
                        break;
                }
            }

            if (scene.objects[i].animation.decay) {
                frameValue += scene.objects[i].animation.decay * 0.25;

                if (frameValue > 1)
                    frameValue -= 1;
            }

            switch (scene.objects[i].animation.function) {
                case 1: frameValue = Math.pow(frameValue, 2); break;
                case 2: frameValue = Math.pow(frameValue, 4); break;
                case 3: frameValue = Math.pow(frameValue, 8); break;
                case 4: frameValue = Math.cos((1 - frameValue) * Math.PI) / 2 + 0.5; break;
                case 5: frameValue = Math.tan((frameValue * 2 - 1) * Math.PI * TAN_TARGET) / 10 + 0.5; break;
            }

            if (scene.objects[i].animation.reverse)
                frameValue = 1.0 - frameValue;
        }

        position = {x: scene.objects[i].frames[0].position.x + (scene.objects[i].frames[1].position.x - scene.objects[i].frames[0].position.x) * frameValue, y: scene.objects[i].frames[0].position.y + (scene.objects[i].frames[1].position.y - scene.objects[i].frames[0].position.y) * frameValue };
        size = {x: scene.objects[i].frames[0].size.x + (scene.objects[i].frames[1].size.x - scene.objects[i].frames[0].size.x) * frameValue, y: scene.objects[i].frames[0].size.y + (scene.objects[i].frames[1].size.y - scene.objects[i].frames[0].size.y) * frameValue };
        angle = scene.objects[i].frames[0].angle + (scene.objects[i].frames[1].angle - scene.objects[i].frames[0].angle) * frameValue;
        opacity = scene.objects[i].frames[0].opacity + (scene.objects[i].frames[1].opacity - scene.objects[i].frames[0].opacity) * frameValue;
        color = getAlphaColor('#ffffff', opacity);

        canvas.strokeStyle = color;
        canvas.fillStyle = canvas.strokeStyle;

        switch (scene.objects[i].type) {
            case 0: drawLine(position.x, position.y, size.x, angle); break;
            case 1: drawRect(position.x, position.y, size.x, size.y, angle); break;
            case 2: drawTriangle(position.x, position.y, size.x, size.y, angle); break;
            //    case 3: drawPath(scene.objects[i].points); break;
            case 4: drawUHW(position.x, position.y, size.x, size.y, angle); break;
            case 5: drawLineVisuilizer(audioData, position.x, position.y, size.x, size.y, angle, Math.round(audioData.length * scene.objects[i].visualizer.range[0]), Math.round(audioData.length * (scene.objects[i].visualizer.range[1] - scene.objects[i].visualizer.range[0])), scene.objects[i].visualizer.reverse); break;
            //    case 6: drawPikesVisuilizer(scene.objects[i].points); break;
        }
    }


/*
    canvas.fillStyle = 'white';
    canvas.strokeStyle = 'white';
    canvas.lineWidth = 4;
    drawLine(0.5, 0.5, 0.8, 0.25);*/
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
        coeff = (i > config.audioDataLength * LIMIT_HIGH_NORM) ? 3.2 : (i > config.audioDataLength * 0.05) ? 2 : 1;
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
let processingBPM = false;
let kickSampleArrSize = DEFAULT_KICK_SAMPLE_ARR_SIZE;

async function computeBPM(now) {
    if (processingBPM)
        return;
    if (sampleKickPosition === kickSampleArrSize) {
        sampleKickPosition = 0;
        kickSampleArrSize *= 1.5;
        sampleKick = new Array(kickSampleArrSize);
        sampleKickTime = new Array(kickSampleArrSize);
        console.error('Adjusting kickSampleArrSize: ' + kickSampleArrSize);
        return;
    } else if (now - sampleKickTime[0] > BPM_SAMPLE_SIZE) {
        processingBPM = true;
        drawSampleKickArray();
        await analyseBpmSample();

        if (config.bpmResetting)
            await resetBPMprogress();

        sampleKickPosition = 0;
        sampleKick[sampleKickPosition] = normalizedAudioData[KICK_FREQ_POSITION];
        sampleKickTime[sampleKickPosition] = now;
        sampleKickPosition++;

        processingBPM = false;
    } else {
        sampleKick[sampleKickPosition] = normalizedAudioData[KICK_FREQ_POSITION];
        sampleKickTime[sampleKickPosition] = now;
        sampleKickPosition++;
    }
}

let lastBPM = [0, 0, 0];
let lastPositionBPM = lastBPM.length - 1;

async function analyseBpmSample() {
    let min = 1.0;
    let max = 0.0;

    for (let i = 0; i !== sampleKickPosition; i++) {
        if (sampleKick[i] < min)
            min = sampleKick[i];
        if (sampleKick[i] > max)
            max = sampleKick[i];
    }

    if (max - min < MINIMIM_KICK_INTENSITY)
        return false;
    const thresholdValue = (max - min) / 2 * BPM_THRESHOLD;
    const threshold = [min + thresholdValue, max - thresholdValue];
    let inThreshold = sampleKick[0] > threshold[1];
    let goingUp = 0;
    let begin;
    let kicks = [];

    for (let i = 0; i !== sampleKickPosition; i++) {
        if (inThreshold) {
            if (sampleKick[i] < threshold[1])
                inThreshold = 0;
        } else {
            if (goingUp === 0 && sampleKick[i] > threshold[1]) {
                goingUp = 1;
                begin = i;
            } else if (goingUp === 2 && sampleKick[i] < threshold[0]) {
                goingUp = 0;
            }

            if (goingUp === 1) {
                if (sampleKick[i] < threshold[1]) {
                    goingUp = 2;
                    kicks.push(begin + Math.round((i - begin) / 2));
                }
            }
        }
    }
    let averageBPM = 0;
    let count = 0;
    let bpm;

    for (let i = 0; i < kicks.length - 1; i++) {
        bpm = 1000 / (sampleKickTime[kicks[i + 1]] - sampleKickTime[kicks[i]]) * 60;

        if (bpm < 1 || !Number.isFinite(bpm))
            continue;

        if (bpm <= BPM_RANGE[1]) {
            while (bpm < BPM_RANGE[0])
                bpm *= 2;
            if (bpm <= BPM_RANGE[1]) {
                averageBPM += bpm;
                count++;
            }
        } else {
            while (bpm > BPM_RANGE[1]) {
                bpm /= 2;
            }
            if (bpm >= BPM_RANGE[0]) {
                averageBPM += bpm * 0.4;
                count += 0.4; // less reliable
            }
        }
    }

    if (count < BPM_SAMPLE_LOOPS || kicks.length < 2)
        return false;
    const avgBPM = averageBPM / count

    if (avgBPM < BPM_RANGE[0] || avgBPM > BPM_RANGE[1])
        return false;
    let indexes = [0, kicks.length - 1];
    let bestBpm = 0;
    const avgTiming = 60 / avgBPM; // ms

    const time = sampleKickTime[kicks[indexes[1]]] - sampleKickTime[indexes[0]];
    bpm = 60 / time * Math.round(time / avgTiming);

    if (bpm < avgBPM - 6 || bpm > avgBPM + 6)
        bpm = avgBPM;

    if (bpm !== config.bpm) {
        config.bpm = Math.round(bpm);
        const now = new Date();
        animationProgress = (now - sampleKickTime[kicks[indexes[1]]]) % (60 / bpm * BPM_SAMPLE_LOOPS);
        config.bpmResetting = true;
        console.log('reset');
        return true;
    }
    return false;
    /*
    lastPositionBPM++;

    if (lastPositionBPM > lastBPM.length)
        lastPositionBPM = 0;
    lastBPM[lastPositionBPM] = bpm;
    averageBPM = 0;
    count = 0;

    for (let i = 0; i !== lastBPM.length; i++) {
        if (lastBPM[i] !== 0) {
            average += lastBPM;
            count++;
        }
    }

    if (count !== 0 && Math.round(bpm) === Math.round(average / count)) {
        config.bpm = Math.round(bpm);
        console.log('final: ' + bpm);
    }*/
}

async function resetBPMprogress() {



    config.bpmResetting = false;
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

function incrementAnimationProgress() {
    let timeout = 1000 / (config.bpm / 60 * 40);

    animationProgress += 0.05;

    if (animationProgress > 4.0)
        animationProgress = 0;

    if (config.run)
        window.setTimeout(incrementAnimationProgress, timeout);
}

function stopLoop() {
    document.getElementById('stop').style.display = 'none';
    config.run = false;
}
