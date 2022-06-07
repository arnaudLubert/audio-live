
if (window.location.href.indexOf('?') !== -1) {
    window.location.href = [window.location.protocol, '//', window.location.host, window.location.pathname].join('');
}

let localStorage = window.localStorage;
const list = document.getElementById('list');
const filePicker = document.getElementById('file-picker');
let scenes;
// localStorage.removeItem('last-session');
function loadScenes() {
    const rawStorage = localStorage.getItem('scenes');
    scenes = rawStorage ? JSON.parse(rawStorage) : [];


    list.innerHTML = '';

    if (scenes.length !== 0) {
        for (let i = scenes.length - 1; i !== -1; i--) {
            list.appendChild(createRow(scenes[i]));
        }
    }
}

function getTypeName(type) {
    switch (type) {
        case 0: return 'Chill / Low bass';
        case 1: return 'Base';
        case 2: return 'Peak / High';
    }
    return ';'
}

function createRow(scene) {
    const elem = document.createElement('div');
    const spans = [ document.createElement('span'),  document.createElement('span'),  document.createElement('span'), document.createElement('span') ];
    const buttons = [ document.createElement('button'), document.createElement('button') ];

    elem.setAttribute('scene-id', scene.id);

    spans[0].innerText = (new Date(scene.date)).toLocaleDateString();
    spans[1].innerText = scene.name;
    spans[2].innerText = scene.objects.length;
    spans[3].innerText = getTypeName(scene.type);
    buttons[0].innerText = 'Duplicate';
    buttons[1].innerText = 'Delete';

    elem.addEventListener('click', (e) => {
        let div = e.target;

        while (div.nodeName !== 'DIV')
            div = div.parentElement;
        window.location.href += '/../editor.html?scene=' + div.getAttribute('scene-id');
    });

    buttons[0].addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        let div = e.target;

        while (div.nodeName !== 'DIV')
            div = div.parentElement;
        duplicateScene(div, parseInt(div.getAttribute('scene-id')));
    });
    buttons[1].addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        let div = e.target;

        while (div.nodeName !== 'DIV')
            div = div.parentElement;
        deleteScene(div, parseInt(div.getAttribute('scene-id')));
    });

    elem.appendChild(spans[0]);
    elem.appendChild(spans[1]);
    elem.appendChild(spans[2]);
    elem.appendChild(spans[3]);
    elem.appendChild(buttons[0]);
    elem.appendChild(buttons[1]);

    return elem;
}

function duplicateScene(elem, id) {
    const rawStorage = localStorage.getItem('scenes');
    scenes = rawStorage ? JSON.parse(rawStorage) : [];
    let index = -1;

    for (let i = scenes.length - 1; i !== -1; i--) {
        if (scenes[i].id === id) {
            let scene = structuredClone(scenes[i]);

            scene.id = getUniqueSceneID();
            scene.date = (new Date()).getTime();

            scenes.push(scene);
            localStorage.setItem('scenes', JSON.stringify(scenes));
            const newRow = createRow(scene);

            if (list.childElementCount)
                list.insertBefore(newRow, list.children[0]);
            else
                list.appendChild(newRow);
            break;
        }
    }
}

function getUniqueSceneID() {
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

function deleteScene(elem, id) {
    const rawStorage = localStorage.getItem('scenes');
    scenes = rawStorage ? JSON.parse(rawStorage) : [];

    for (let i = scenes.length - 1; i !== -1; i--)
        if (scenes[i].id === id) {
            scenes.splice(i, 1);
            break;
        }

    localStorage.setItem('scenes', JSON.stringify(scenes));
    elem.remove();
}

function saveAsFile() {
    const rawStorage = localStorage.getItem('scenes');

    if (rawStorage) {
        const downlod = document.createElement('a');
        downlod.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(rawStorage));
        downlod.setAttribute('download', 'audio-live.json');
        document.body.appendChild(downlod);
        downlod.click();
        document.body.removeChild(downlod);
    }
}

function loadFromFile() {
    filePicker.click();
}

filePicker.addEventListener('change', (e) => {
    const file = e.target.files[0];

    if (!file)
        return;
    const reader = new FileReader();

    reader.onload = (ev) => {
        if (ev.target.readyState !== 2) {
            console.error('ev.target.readyState !== 2');
            return;
        }
        const rawStorage = localStorage.getItem('scenes');
        scenes = rawStorage ? JSON.parse(rawStorage) : [];

        let data = JSON.parse(ev.target.result);
        let found = new Array(data.length);

        for (let i = 0; i !== data.length; i++) {
            found[i] = false;
            for (let j = 0; j !== scenes.length; j++) {
                if (data[i].hash === scenes[j].hash) {
                    found[i] = true;
                    break;
                }
            }
        }
        const date = (new Date()).getTime();
        let maxID = 0;

        for (let j = scenes.length - 1; j !== -1; j--) {
            if (scenes[j].id > maxID)
                maxID = scenes[j].id + 1;
        }

        for (let i = 0; i !== data.length; i++) {
            if ( !found[i]) {
                data[i].id = maxID++;
                data[i].date = date;
                scenes.push(data[i]);
            }
        }

        localStorage.setItem('scenes', JSON.stringify(scenes));
        window.location.reload();
    };
    reader.onerror = (ev) => {
        console.error(ev)
    };
    reader.readAsText(file, "UTF-8");
});
filePicker.multiple = false;
filePicker.accept = "application/json";

function openNewScene() {
    window.location.href += '/../editor.html';
}

function openLive() {
    window.location.href += '/../index.html';
}

loadScenes();
