function drawLine(x, y, width, angle) {
    canvas.translate(config.width * x, config.height * y);
    canvas.rotate(angle * Math.PI * 2);

    canvas.beginPath();
    const length = config.height * width / 2;
    canvas.moveTo(-length, 0)
    canvas.lineTo(length, 0);
    canvas.stroke();

    canvas.rotate(-angle * Math.PI * 2);
    canvas.translate(-config.width * x, -config.height * y);
}

function drawLineVisuilizer(audioData, x, y, width, height, angle, dataOffset, dataSize, reverse) {
    const limits = [-config.height * width / 2, config.height * width, 0, config.height * height * 2];
    const barSize = config.height * width / dataSize;

    canvas.translate(config.width * x, config.height * y);
    canvas.rotate(angle * Math.PI * 2);

    let barY;
    let i = reverse ? dataOffset + dataSize - 1 : dataOffset;
    let j = 0;

    while (j !== dataSize) {
        canvas.beginPath();
        barY = limits[2] - limits[3] * audioData[i];
        canvas.moveTo(limits[0] + j * barSize, barY)
        canvas.lineTo(limits[0] + (j + 1) * barSize, barY);
        canvas.stroke();
        j++;
        i += reverse ? -1 : 1;
    }

    canvas.rotate(-angle * Math.PI * 2);
    canvas.translate(-config.width * x, -config.height * y);
}

function drawRect(x, y, width, height, angle) {
    canvas.translate(config.width * x, config.height * y);
    canvas.rotate(angle * Math.PI * 2);

    const lengths = [config.height * width, config.height * height];
    canvas.strokeRect(-lengths[0] / 2, -lengths[1] / 2, lengths[0], lengths[1]);

    canvas.rotate(-angle * Math.PI * 2);
    canvas.translate(-config.width * x, -config.height * y);
}

function drawTriangle(x, y, width, height, angle) {
    canvas.translate(config.width * x, config.height * y);
    canvas.rotate(angle * Math.PI * 2);

    const lengths = [config.height * width / 2, config.height * height * 0.37];
    canvas.beginPath();
    canvas.moveTo(-lengths[0], lengths[1]);
    canvas.lineTo(0, -lengths[1]);
    canvas.lineTo(lengths[0], lengths[1]);
    canvas.closePath();
    canvas.stroke();

    canvas.rotate(-angle * Math.PI * 2);
    canvas.translate(-config.width * x, -config.height * y);
}

function drawPath(points) {

    if (points.length === 0)
        return;
    canvas.beginPath();
    canvas.moveTo(config.width * points[0].x, config.height * points[0].y);

    for (let i = 1; i !== points.length; i++)
        canvas.lineTo(config.width * points[i].x, config.height * points[i].y);
    canvas.closePath();
    canvas.stroke();
}

const piecesUHW = [
    // U
    [{x: -0.5, y: -0.1331}, {x: -0.4193, y: -0.1331}, {x: -0.4193, y: -0.1241}, {x: -0.5, y: -0.1259}],
    [{x: -0.5, y: -0.1157}, {x: -0.4193, y: -0.1138}, {x: -0.4193, y: -0.1033}, {x: -0.5, y: -0.0852}],
    [{x: -0.5, y: -0.0746}, {x: -0.4193, y: -0.0927}, {x: -0.4193, y: -0.0888}, {x: -0.5, y: -0.0263}],
    [{x: -0.5, y: -0.0133}, {x: -0.4193, y: -0.0757}, {x: -0.4193, y: 0.004}, {x: -0.5, y: -0.0086}],
    [{x: -0.5, y: 0.0018}, {x: -0.4302, y: 0.0127}, {x: -0.4994, y: 0.0343}, {x: -0.5, y: 0.0228}],
    [{x: -0.4979, y: 0.0446}, {x: -0.4193, y: 0.0201}, {x: -0.4193, y: 0.0265}, {x: -0.4182, y: 0.0388}, {x: -0.4891, y: 0.0762}, {x: -0.4925, y: 0.0671}, {x: -0.4947, y: 0.0592}],
    [{x: -0.4623, y: 0.0737}, {x: -0.4151, y: 0.0488}, {x: -0.4076, y: 0.0598}],
    [{x: -0.4815, y: 0.0893}, {x: -0.3967, y: 0.0676}, {x: -0.3889, y: 0.0704}, {x: -0.4412, y: 0.1227}, {x: -0.4475, y: 0.1198}, {x: -0.4623, y: 0.1099}, {x: -0.4753, y: 0.0972}],
    [{x: -0.4304, y: 0.1264}, {x: -0.3928, y: 0.088}, {x: -0.4084, y: 0.1306}, {x: -0.4193, y: 0.129}],
    [{x: -0.3755, y: 0.072}, {x: -0.3677, y: 0.0717}, {x: -0.358, y: 0.0698}, {x: -0.3515, y: 0.0672}, {x: -0.3335, y: 0.1302}, {x: -0.3681, y: 0.1331}, {x: -0.3978, y: 0.1317}],
    [{x: -0.3386, y: 0.0749}, {x: -0.2867, y: 0.1097}, {x: -0.2994, y: 0.1186}, {x: -0.3115, y: 0.1243}, {x: -0.3234, y: 0.1281}],
    [{x: -0.3417, y: 0.0602}, {x: -0.3365, y: 0.0535}, {x: -0.3346, y: 0.05}, {x: -0.3327, y: 0.0453}, {x: -0.3307, y: 0.0371}, {x: -0.2634, y: 0.0822}, {x: -0.2665, y: 0.0872}, {x: -0.2705, y: 0.0928}, {x: -0.2726, y: 0.0955}, {x: -0.2789, y: 0.1025}],
    [{x: -0.3299, y: 0.0252}, {x: -0.3299, y: 0.0024}, {x: -0.2492, y: 0.0199}, {x: -0.2501, y: 0.0394}, {x: -0.2533, y: 0.0562}, {x: -0.2564, y: 0.066}, {x: -0.2588, y: 0.0728}],
    [{x: -0.3299, y: -0.0081}, {x: -0.3299, y: -0.0327}, {x: -0.2492, y: -0.0461}, {x: -0.2492, y: 0.0094}],
    [{x: -0.3299, y: -0.0431}, {x: -0.3299, y: -0.0603}, {x: -0.2492, y: -0.0636}, {x: -0.2492, y: -0.0566}],
    [{x: -0.3299, y: -0.0706}, {x: -0.3299, y: -0.1003}, {x: -0.2492, y: -0.1331}, {x: -0.2492, y: -0.0739}],
    [{x: -0.3299, y: -0.1114}, {x: -0.3299, y: -0.1331}, {x: -0.2767, y: -0.1331}],

    // H
    [{x: -0.1693, y: -0.1331}, {x: -0.0885, y: -0.1331}, {x: -0.0885, y: -0.0834}, {x: -0.1693, y: -0.0995}],
    [{x: -0.1693, y: -0.089}, {x: -0.0885, y: -0.0729}, {x: -0.0885, y: -0.0578}, {x: -0.1693, y: -0.0164}],
    [{x: -0.1693, y: -0.0048}, {x: -0.0892, y: -0.0459}, {x: -0.0961, y: 0.0026}, {x: -0.1693, y: 0.026}],
    [{x: -0.1693, y: 0.0607}, {x: -0.0885, y: 0.0478}, {x: -0.0885, y: 0.0981}, {x: -0.1693, y: 0.0744}],
    [{x: -0.1693, y: 0.0851}, {x: -0.0885, y: 0.1089}, {x: -0.0885, y: 0.1286}, {x: -0.1693, y: 0.1286}],
    [{x: -0.0004, y: 0.0182}, {x: 0.025, y: -0.0197}, {x: 0.0811, y: -0.035}, {x: 0.0811, y: 0.0014}],
    [{x: -0.1693, y: 0.033}, {x: 0.0099, y: -0.0156}, {x: -0.016, y: 0.028}, {x: -0.0885, y: 0.0228}, {x: -0.0885, y: 0.0374}, {x: -0.1693, y: 0.0503}],
    [{x: -0.0853, y: -0.0003}, {x: -0.0794, y: -0.0415}, {x: -0.0116, y: -0.0415}, {x: -0.0129, y: -0.02}],
    [{x: -0.0013, y: -0.0408}, {x: 0.0811, y: -0.0507}, {x: 0.0811, y: -0.0456}, {x: -0.0024, y: -0.0229}],
    [{x: -0.0001, y: -0.1331}, {x: 0.0329, y: -0.1331}, {x: -0.0001, y: -0.1116}],
    [{x: -0.0001, y: -0.0993}, {x: 0.0518, y: -0.1331}, {x: 0.0811, y: -0.1331}, {x: 0.0811, y: -0.0747}, {x: -0.0001, y: -0.0903}],
    [{x: -0.0001, y: -0.0798}, {x: 0.0811, y: -0.0642}, {x: 0.0811, y: -0.0611}, {x: -0.0001, y: -0.0513}],
    [{x: -0.0001, y: 0.0286}, {x: 0.0811, y: 0.0119}, {x: 0.0811, y: 0.0562}, {x: -0.0001, y: 0.0672}],
    [{x: -0.0001, y: 0.0775}, {x: 0.0811, y: 0.0666}, {x: 0.0811, y: 0.1068}, {x: -0.00011, y: 0.1178}],
    [{x: -0.0001, y: 0.1282}, {x: 0.0811, y: 0.1172}, {x: 0.0811, y: 0.1286}, {x: -0.0001, y: 0.1286}],
    // W
    [{x: 0.1339, y: -0.1331}, {x: 0.1701, y: -0.1331}, {x: 0.1414, y: -0.0992}],
    [{x: 0.1442, y: -0.0866}, {x: 0.1836, y: -0.1331}, {x: 0.2107, y: -0.1331}, {x: 0.22, y: -0.0839}, {x: 0.147, y: -0.0741}],
    [{x: 0.1492, y: -0.0641}, {x: 0.2219, y: -0.0737}, {x: 0.2278, y: -0.0425}, {x: 0.1553, y: -0.0367}],
    [{x: 0.1576, y: -0.0266}, {x: 0.2163, y: -0.0313}, {x: 0.1656, y: 0.0097}],
    [{x: 0.1827, y: 0.0091}, {x: 0.2303, y: -0.0293}, {x: 0.2357, y: -0.0008}],
    [{x: 0.1684, y: 0.0223}, {x: 0.2289, y: 0.011}, {x: 0.1889, y: 0.1145}],
    [{x: 0.2383, y: 0.0152}, {x: 0.2732, y: 0.1222}, {x: 0.2714, y: 0.1286}, {x: 0.1945, y: 0.1286}],
    [{x: 0.2782, y: 0.1042}, {x: 0.2429, y: -0.0031}, {x: 0.2475, y: -0.0196}, {x: 0.3102, y: -0.0112}],
    [{x: 0.2502, y: -0.0297}, {x: 0.254, y: -0.0431}, {x: 0.3005, y: -0.0851}, {x: 0.3099, y: -0.0217}],
    [{x: 0.259, y: -0.0616}, {x: 0.2788, y: -0.1333}, {x: 0.289, y: -0.1331}, {x: 0.3191, y: -0.1157}],
    [{x: 0.3096, y: -0.1331}, {x: 0.3553, y: -0.1331}, {x: 0.364, y: -0.1017}],
    [{x: 0.3097, y: -0.0934}, {x: 0.3285, y: -0.1103}, {x: 0.368, y: -0.0875}, {x: 0.372, y: -0.0731}, {x: 0.3257, y: -0.0054}, {x: 0.3194, y: -0.028}],
    [{x: 0.3293, y: 0.0076}, {x: 0.3756, y: -0.0601}, {x: 0.3906, y: -0.0059}, {x: 0.3346, y: 0.0265}],
    [{x: 0.3374, y: 0.0367}, {x: 0.3908, y: 0.0059}, {x: 0.4041, y: 0.0388}, {x: 0.3424, y: 0.0546}],
    [{x: 0.3451, y: 0.0645}, {x: 0.4031, y: 0.0497}, {x: 0.3597, y: 0.1167}],
    [{x: 0.3642, y: 0.1286}, {x: 0.4111, y: 0.0561}, {x: 0.4406, y: 0.1286}],
    [{x: 0.4456, y: 0.1136}, {x: 0.4046, y: 0.0128}, {x: 0.4577, y: 0.0586}],
    [{x: 0.4603, y: 0.0472}, {x: 0.3994, y: -0.0054}, {x: 0.405, y: -0.035}, {x: 0.479, y: -0.0378}],
    [{x: 0.407, y: -0.0454}, {x: 0.4154, y: -0.0898}, {x: 0.484, y: -0.0606}, {x: 0.4813, y: -0.0482}],
    [{x: 0.4174, y: -0.1002}, {x: 0.4229, y: -0.1294}, {x: 0.491, y: -0.0924}, {x: 0.4863, y: -0.0708}],
    [{x: 0.4377, y: -0.1331}, {x: 0.5, y: -0.1331}, {x: 0.4933, y: -0.1028}],
];

function drawUHW(x, y, width, height, angle) {
    canvas.translate(config.width * x, config.height * y);
    canvas.rotate(angle * Math.PI * 2);

    for (const points of piecesUHW) {
        canvas.beginPath();
        canvas.moveTo(config.height * points[0].x * width, config.height * points[0].y * height);

        for (let i = 1; i !== points.length; i++)
            canvas.lineTo(config.height * points[i].x * width, config.height * points[i].y * height);
        //canvas.closePath();
        canvas.fill();
    }

    canvas.rotate(-angle * Math.PI * 2);
    canvas.translate(-config.width * x, -config.height * y);
}
