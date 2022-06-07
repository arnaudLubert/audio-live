const loopProgress = document.getElementById('loop-progress');
const animationFrame = document.getElementById('animation-frame');
const canv = document.getElementById('canvas', {alpha: false});
const canvas = canv.getContext('2d');

let config = {
    width: canv.width = canv.clientWidth * 2,
    height: canv.height = canv.clientHeight * 2,
    realTime: false,
    bpm: 120,
    musicType: 1
}

const AUDIO_DATA_SIZE = 50;
const TAN_TARGET = 0.4371671;
let currentFrame = 0;
let selectedObject = null;
let animationFrameTriggered = false;
let objects = [];

canvas.lineWidth = 4;

function draw() {
    canvas.clearRect(0, 0, config.width, config.height);

    const audioData = generateAudioData();
    const splitFreqs = [audioData[7], audioData[14], audioData[21], audioData[28], audioData[35], audioData[42]];
    let position, size, angle, frameValue, opacity, color;

    for (const object of objects) {
        if ( !config.realTime && animationFrameTriggered && selectedObject && selectedObject == object)
            frameValue = animationFrame.value;
        else {
            if (object.animation.activation === 1)
                frameValue = 0.0;
            else if (object.animation.activation > 1)
                frameValue = splitFreqs[object.animation.activation - 2];
            else {
                switch (object.animation.loop) {
                    case 0:
                        frameValue = audioDataGenerateSeed % 1.0;
                        break;
                    case 1:
                        frameValue = audioDataGenerateSeed % 2.0 / 2;
                        break;
                    case 2:
                        frameValue = audioDataGenerateSeed % 2 < 1.0 ? audioDataGenerateSeed % 2 : 2 - audioDataGenerateSeed % 2;
                        break;
                    case 3:
                        frameValue = audioDataGenerateSeed / 4;
                        break;
                    case 4:
                        frameValue = (audioDataGenerateSeed < 2.0 ? audioDataGenerateSeed : 4 - audioDataGenerateSeed) / 2;
                        break;
                }
            }

            if (object.animation.decay) {
                frameValue += object.animation.decay * 0.25;

                if (frameValue > 1)
                    frameValue -= 1;
            }

            switch (object.animation.function) {
                case 1: frameValue = Math.pow(frameValue, 2); break;
                case 2: frameValue = Math.pow(frameValue, 4); break;
                case 3: frameValue = Math.pow(frameValue, 8); break;
                case 4: frameValue = Math.cos((1 - frameValue) * Math.PI) / 2 + 0.5; break;
                case 5: frameValue = Math.tan((frameValue * 2 - 1) * Math.PI * TAN_TARGET) / 10 + 0.5; break;
            }

            if (object.animation.reverse)
                frameValue = 1.0 - frameValue;
        }

        position = {x: object.frames[0].position.x + (object.frames[1].position.x - object.frames[0].position.x) * frameValue, y: object.frames[0].position.y + (object.frames[1].position.y - object.frames[0].position.y) * frameValue };
        size = {x: object.frames[0].size.x + (object.frames[1].size.x - object.frames[0].size.x) * frameValue, y: object.frames[0].size.y + (object.frames[1].size.y - object.frames[0].size.y) * frameValue };
        angle = object.frames[0].angle + (object.frames[1].angle - object.frames[0].angle) * frameValue;
        opacity = object.frames[0].opacity + (object.frames[1].opacity - object.frames[0].opacity) * frameValue;
        color = getAlphaColor('#ffffff', opacity);

        canvas.strokeStyle = color;
        canvas.fillStyle = canvas.strokeStyle;

        switch (object.type) {
            case 0: drawLine(position.x, position.y, size.x, angle); break;
            case 1: drawRect(position.x, position.y, size.x, size.y, angle); break;
            case 2: drawTriangle(position.x, position.y, size.x, size.y, angle); break;
            //    case 3: drawPath(object.points); break;
            case 4: drawUHW(position.x, position.y, size.x, size.y, angle); break;
            case 5: drawLineVisuilizer(audioData, position.x, position.y, size.x, size.y, angle, Math.round(audioData.length * object.visualizer.range[0]), Math.round(audioData.length * (object.visualizer.range[1] - object.visualizer.range[0])), object.visualizer.reverse); break;
            //    case 6: drawPikesVisuilizer(object.points); break;
        }
    }

    if (config.realTime)
        requestAnimationFrame(draw);
}

function addObject() {
    const type = document.getElementById('object-type');

    const object = {
        id: getUniqueName(type.options[type.selectedIndex].innerText),
        type: parseInt(type.options[type.selectedIndex].value),
        frames: [{
            position: {x: 0.5, y: 0.5},
            size: {x: 0.5, y: 0.5},
            angle: 0.0,
            opacity: 1.0
        }, {
            position: {x: 0.5, y: 0.5},
            size: {x: 0.5, y: 0.5},
            angle: 0.0,
            opacity: 1.0
        }],
        visualizer: {
            range: [0.0, 1.0],
            reverse: false
        },
        animation: {
            activation: 3,
            loop: 2,
            function: 0,
            reverse: false,
            decay: 0
        }
    };
    createObject(object);
}

function createObject(object) {
    objects.push(object);
    const elem = document.createElement('div');
    elem.innerText = object.id;
    elem.setAttribute('object-id', object.id);
    elem.addEventListener('click', (e) => {
        selectObject(e.target.getAttribute('object-id'));
    });

    document.getElementById('hierarchy').appendChild(elem);
    selectObject(object.id);
    draw();
}

function duplicateObject() {
    if ( !selectedObject)
        return;
    let object = structuredClone(selectedObject);
    object.id = getUniqueName(object.id, true);
    createObject(object);
}

function removeObject() {
    if ( !selectedObject)
        return;
    const list = document.getElementById('hierarchy');

    for (i = 0; i !== list.childElementCount; i++) {
        if (list.children[i].innerText === selectedObject.id) {
            list.children[i].remove();
            break;
        }
    }
    let index = -1;

    for (i = 0; i !== objects.length; i++) {
        if (objects[i].id === selectedObject.id) {
            objects.splice(i, 1);
            break;
        }
    }
    selectedObject = null;
    draw();
}

function selectObject(id) {
    const list = document.getElementById('hierarchy');

    for (i = 0; i !== list.childElementCount; i++) {
        if (list.children[i].innerText === id)
            list.children[i].classList.add('selected');
        else if (list.children[i].classList.contains('selected'))
            list.children[i].classList.remove('selected');
    }
    selectedObject = null;

    for (i = 0; i !== objects.childElementCount; i++) {
        if (objects[i].id === id) {
            selectedObject = objects[i];
            break;
        }
    }
    setFrame(0, true);
}

function getUniqueName(str, duplicate = false) {
    const list = document.getElementById('hierarchy');
    let baseStr = str;
    let found = true;
    let num = 0;

    if (duplicate && baseStr.charAt(baseStr.length - 2) === ' ')
        baseStr = baseStr.substr(0, baseStr.length - 2);

    while (found) {
        found = false;

        for (i = 0; i !== list.childElementCount; i++) {
            if (list.children[i].getAttribute('object-id') === str) {
                found = true;
                num++;
                str = baseStr + ' ' + num;
                break;
            }
        }
    }
    return str;
}

function setFrame(frame, overrideSlider = false) {
    currentFrame = frame;

    if (overrideSlider) {
        animationFrame.value = currentFrame;
        animationFrameTriggered = true;
        draw();
    }
    updateSaveFrameButton();
    loadObjectData();
}

function updateSaveFrameButton() {
    const value = animationFrame.value;
    document.getElementById('save-frame').innerText = 'Overrite frame ' + (value > 0.5 ? 1 : 2);
    document.getElementById('frame-name').innerText = '(Frame ' + (value > 0.5 ? 2 : 1) + ')';
}

let audioDataGenerateSeed = 0;

function generateAudioData() {
    let audioData = new Float32Array(AUDIO_DATA_SIZE);
    let step = audioDataGenerateSeed;

    for (let i = 0; i !== AUDIO_DATA_SIZE; i++) {
        audioData[i] = (1 + Math.sin(step % 2 * Math.PI)) / 2;
        step += 0.1;

        if (step > 4.0)
            step = 0;
    }
    return audioData;
}

function loopBPM() {
    let timeout = 1000 / (config.bpm / 60 * 20);

    audioDataGenerateSeed += 0.1;

    if (audioDataGenerateSeed > 4.0)
        audioDataGenerateSeed = 0;

    loopProgress.value = audioDataGenerateSeed;

    if (config.realTime)
        window.setTimeout(loopBPM, timeout);
}

function loadObjectData() {
    if ( !selectedObject)
        return;
    document.getElementById('object-position-x').value = selectedObject.frames[currentFrame].position.x;
    document.getElementById('object-position-y').value = selectedObject.frames[currentFrame].position.y;
    document.getElementById('object-size-x').value = selectedObject.frames[currentFrame].size.x;
    document.getElementById('object-size-y').value = selectedObject.frames[currentFrame].size.y;
    document.getElementById('object-angle').value = selectedObject.frames[currentFrame].angle;
    document.getElementById('object-opacity').value = selectedObject.frames[currentFrame].opacity;

    document.getElementById('object-visualizer-range-start').value = selectedObject.visualizer.range[0];
    document.getElementById('object-visualizer-range-end').value = selectedObject.visualizer.range[1];
    document.getElementById('object-visualizer-reverse').checked = selectedObject.visualizer.reverse;

    setSelectValue(document.getElementById('object-animation-activation'), selectedObject.animation.activation);
    setSelectValue(document.getElementById('object-animation-loop'), selectedObject.animation.loop);
    setSelectValue(document.getElementById('object-animation-function'), selectedObject.animation.function);
    document.getElementById('object-animation-reverse').checked = selectedObject.animation.reverse;
    setSelectValue(document.getElementById('object-animation-decay'), selectedObject.animation.decay);
}

function setSelectValue(select, value) {
    for (let i = 0; i !== select.options.length; i++)
        if (select.options[i].value == value) {
            select.selectedIndex = i;
            break;
        }
}

function initListeners() {
    animationFrame.addEventListener('change', (e) => {
        setFrame((e.target.value > 0.5) ? 1 : 0);
    });
    animationFrame.addEventListener('input', (e) => {
        if (config.realTime) {
            config.realTime = false;
            document.getElementById('real-time').checked = false;
        }
        animationFrameTriggered = true;
        draw();
    });
    loopProgress.addEventListener('input', (e) => {
        if (config.realTime) {
            config.realTime = false;
            document.getElementById('real-time').checked = false;
        }
        animationFrameTriggered = false;
        audioDataGenerateSeed = parseFloat(loopProgress.value);
        draw();
    });
    document.getElementById('object-position-x').addEventListener('input', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.frames[currentFrame].position.x = parseFloat(e.target.value);
        draw();
    });
    document.getElementById('object-position-y').addEventListener('input', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.frames[currentFrame].position.y = parseFloat(e.target.value);
        draw();
    });
    document.getElementById('object-size-x').addEventListener('input', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.frames[currentFrame].size.x = parseFloat(e.target.value);
        draw();
    });
    document.getElementById('object-size-y').addEventListener('input', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.frames[currentFrame].size.y = parseFloat(e.target.value);
        draw();
    });
    document.getElementById('object-angle').addEventListener('input', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.frames[currentFrame].angle = parseFloat(e.target.value);
        draw();
    });
    document.getElementById('object-opacity').addEventListener('input', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.frames[currentFrame].opacity = parseFloat(e.target.value);
        draw();
    });

    document.getElementById('object-visualizer-range-start').addEventListener('change', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.visualizer.range[0] = parseFloat(e.target.value);
        draw();
    });
    document.getElementById('object-visualizer-range-end').addEventListener('change', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.visualizer.range[1] = parseFloat(e.target.value);
        draw();
    });
    document.getElementById('object-visualizer-reverse').addEventListener('change', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.visualizer.reverse = e.target.checked;
        draw();
    });

    document.getElementById('object-animation-activation').addEventListener('change', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.animation.activation = parseInt(e.target.options[e.target.selectedIndex].value);
        draw();
    });
    document.getElementById('object-animation-loop').addEventListener('change', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.animation.loop = parseInt(e.target.options[e.target.selectedIndex].value);
        draw();
    });
    document.getElementById('object-animation-function').addEventListener('change', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.animation.function = parseInt(e.target.options[e.target.selectedIndex].value);
        draw();
    });
    document.getElementById('object-animation-reverse').addEventListener('change', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.animation.reverse = e.target.checked;
        draw();
    });
    document.getElementById('object-animation-decay').addEventListener('change', (e) => {
        if ( !selectedObject)
            return;
        selectedObject.animation.decay = parseInt(e.target.options[e.target.selectedIndex].value);
        draw();
    });

    document.getElementById('save-frame').addEventListener('click', (e) => {
        if ( !selectedObject)
            return;
        const frameDest = currentFrame ? 0 : 1;
        selectedObject.frames[frameDest].position.x = selectedObject.frames[currentFrame].position.x;
        selectedObject.frames[frameDest].position.y = selectedObject.frames[currentFrame].position.y;
        selectedObject.frames[frameDest].size.x = selectedObject.frames[currentFrame].size.x;
        selectedObject.frames[frameDest].size.y = selectedObject.frames[currentFrame].size.y;
        selectedObject.frames[frameDest].angle = selectedObject.frames[currentFrame].angle;
        selectedObject.frames[frameDest].opacity = selectedObject.frames[currentFrame].opacity;
        draw();
    });

    document.getElementById('real-time').addEventListener('change', (e) => {
        config.realTime = e.target.checked;

        animationFrameTriggered = false;

        if (config.realTime)
            loopBPM();
        draw();
    });

    document.getElementById('bpm').addEventListener('change', (e) => {
        if ( !selectedObject)
            return;
        config.bpm = parseFloat(e.target.value);
    });

    window.addEventListener('resize', () => {
        canv.width = canv.clientWidth * 2;
        canv.height = canv.clientHeight * 2;
        config.width = canv.width;
        config.height = canv.height;
        canvas.lineWidth = 4;
        draw();
    });
}
initListeners();

let localStorage = window.localStorage;

function initScene() {
    const rawStorage = localStorage.getItem('scenes');
    let scenes = rawStorage ? JSON.parse(rawStorage) : [];
    const query = new URLSearchParams(window.location.search);
    let sceneID = query.get('scene');

    if (sceneID !== '') {
        sceneID = parseInt(sceneID);
        let scene;

        for (i = 0; i !== scenes.length; i++) {
            if (scenes[i].id === sceneID) {
                scene = scenes[i];
                break;
            }
        }

        if (scene) {
            setSelectValue(document.getElementById('description'), scene.type);
            document.getElementById('scene-name').value = scene.name;
            document.getElementById('bpm').value = scene.bpm;
            objects = scene.objects;
            const hierarchy = document.getElementById('hierarchy');

            for (let i = 0; i !== objects.length; i++) {
                const elem = document.createElement('div');
                elem.innerText = objects[i].id;
                elem.setAttribute('object-id', objects[i].id);
                elem.addEventListener('click', (e) => {
                    selectObject(e.target.getAttribute('object-id'));
                });
                hierarchy.appendChild(elem);

                if ( !objects[i].animation.hasOwnProperty('function')) {
                    objects[i].animation.function = 0;
                    objects[i].animation.reverse = false;
                    objects[i].animation.decay = 0;
                }
            }
        }
    }
    draw();
}
initScene();

function saveScene() {
    const rawStorage = localStorage.getItem('scenes');
    let scenes = rawStorage ? JSON.parse(rawStorage) : [];
    const type = document.getElementById('description');
    let name = document.getElementById('scene-name').value;
    let dataReplaced = false;

    const query = new URLSearchParams(window.location.search);
    let sceneID = query.get('scene');

    if (sceneID !== '') {
        sceneID = parseInt(sceneID);
        let sceneRealID = -1;

        for (i = 0; i !== scenes.length; i++) {
            if (scenes[i].id === sceneID) {
                sceneRealID = i;
                break;
            }
        }

        if (sceneRealID !== -1) {
            if (name !== '')
                name = getUniqueSceneName(scenes, name, sceneRealID);
            scenes[sceneRealID].name = name;
            scenes[sceneRealID].objects = objects;
            scenes[sceneRealID].type = parseInt(type.options[type.selectedIndex].value);
            scenes[sceneRealID].bpm = parseInt(document.getElementById('bpm').value);
            scenes[sceneRealID].hash = generateHash(objects, scenes[sceneRealID].type);
            dataReplaced = true;
        }
    }

    if ( !dataReplaced) {
        if (name !== '')
            name = getUniqueSceneName(scenes, name);

        let scene = {
            id: getUniqueSceneID(scenes),
            name: name,
            objects: objects,
            type: parseInt(type.options[type.selectedIndex].value),
            bpm: parseInt(document.getElementById('bpm').value),
            date: (new Date()).getTime(),
            hash: ''
        };
        scene.hash = generateHash(objects, scene.type);
        scenes.push(scene);
    }
    localStorage.setItem('scenes', JSON.stringify(scenes));
    window.location.pathname += '/../scenes.html';
}

function generateHash(objects, type) {
    let hash = type * 1234567;

    for (let i = objects.length - 1; i !== -1; i--) {
        hash += i * 1000 + objects[i].type * 5 + objects[i].frames[0].position.x * 30 + objects[i].frames[0].position.y * 82 + objects[i].frames[0].size.x * 4 + objects[i].frames[0].size.y * 34 + objects[i].frames[0].angle * 19 + objects[i].frames[0].opacity * 91 + objects[i].frames[1].position.x * 89 + objects[i].frames[1].position.y * 25 + objects[i].frames[1].size.x * 9 + objects[i].frames[1].size.y * 96 + objects[i].frames[1].angle * 59 + objects[i].frames[1].opacity * 43 + objects[i].visualizer.range[0] * 26 + objects[i].visualizer.range[1] * 39 + (objects[i].visualizer.reverse ? 1 : 0) + objects[i].animation.activation * 40 + objects[i].animation.loop * 50 + objects[i].animation.function * 14 + (objects[i].animation.reverse ? 7 : 0) + objects[i].animation.decay * 74;
    }

    return hash.toString(36);
}

function getUniqueSceneID(scenes) {
    let found = true;
    let index = 0;

    while (found) {
        found = false;

        for (i = 0; i !== scenes.length; i++) {
            if (scenes[i].id >= index) {
                found = true;
                index++;
                break;
            }
        }
    }
    return index;
}

function getUniqueSceneName(scenes, str, excludeID = -1) {
    let baseStr = str;
    let found = true;
    let num = 0;

    while (found) {
        found = false;

        for (i = 0; i !== scenes.length; i++) {
            if (scenes[i].name === str && i !== excludeID) {
                found = true;
                num++;
                str = baseStr + ' ' + num;
                break;
            }
        }
    }
    return str;
}
