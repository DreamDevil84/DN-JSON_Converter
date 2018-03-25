var textInfo = document.getElementById("textInfo");
var canvas = document.getElementById("myCanvas");
var sensitivityInput = document.getElementById("sensitivityInput").value;
var btnShow = document.getElementById("btnShow");
var controlPanel = document.getElementById("controlPanel");
var loadButton = document.getElementById("loadButton");

controlPanel.style.visibility = "hidden";

var storage = window.localStorage;

var ctx = canvas.getContext("2d");
var currentPath = "water.json";
var sensitivity = sensitivityInput / 10;
var rawData = [];
var outlineData = [];
var coords = [];
var layer = 0;
var running = false;

textInfo.innerHTML = "Text info goes here";

canvas.setAttribute("width", 256);
canvas.setAttribute("height", 256);



function pressShow() {
    let outline = makeOutline(rawData[layer]);
    drawCanvas(outline);
}

function pressContrast() {
    let contrast = getBinaryContrast(rawData[layer]);
    drawCanvas(contrast);
}

function pressAnimate() {
    sensitivity = 0;
    running = !running;
    // sensitivity = document.getElementById("sensitivityInput").value / 10;
    // drawCanvas(rawData[layer]);
    if (running === true) {
        // makeOutlineArray();
        animateCont();
    }
}

function nextLayer(data) {
    if (layer >= data.length - 1) {
        layer = 0;
    } else {
        layer++;
    }
    drawCanvas(data[layer]);
}

function animateCont() {
    nextLayer(rawData);
    if (running === true) {
        requestAnimationFrame(animateCont);
    }
}


function getData(path) {
    let request = new XMLHttpRequest();
    request.open("GET", path);
    request.send();
    textInfo.innerHTML = "LOADING";
    request.onreadystatechange = function () {
        if (this.readyState == 4) {
            rawData = JSON.parse(this.responseText);
            let test = makeOutline(rawData[layer]);
            drawCanvas(test);
            makeOutlineArray();
            textInfo.innerHTML = "DONE";
            loadButton.style.visibility = "hidden";
            controlPanel.style.visibility = "visible";
        }
    }
}

function makeOutlineArray() {
    outlineData = [];
    for (let z = 0; z < rawData.length; z++) {
        let temp = makeOutline(rawData[z]);
        outlineData.push(temp);
    }
}

function drawCanvas(data) {
    sensitivity = document.getElementById("sensitivityInput").value / 10;
    for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[y].length; x++) {
            if (data[y][x] < sensitivity) {
                ctx.fillStyle = "#000000";
            } else {
                let intensity = Math.floor(Math.abs(data[y][x]) * 255);
                ctx.fillStyle = "rgb(" + intensity + "," + intensity + "," + intensity + ")";
            }
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

//########################################
//  Outline functions
//########################################

//NOTE: Asumes array is consistant in length, AKA not dynamic
function makeOutline(data) {
    let outlineSensitivity = document.getElementById("sensitivityInput").value/10;
    let outline = [];
    for (let y = 0; y < data[0].length; y++) {
        let line = [];
        for (let x = 0; x < data.length; x++) {
            if (Math.abs(data[x][y]) >= outlineSensitivity) {
                line.push(1);
            } else {
                line.push(0);
            }
        }
        let first = findFirst(line);
        let last = findLast(line);
        line.fill(0, 0, line.length);
        if (first >= 0) {
            line[first] = 1;
        }
        if (last >= 0) {
            line[last] = 1;
        }
        // console.log(first + ": " + last);
        outline.push(line);
    }
    outline = rotateOutline(outline);
    // console.log(outline)
    // outline = reduceHorizontalDuplicates(outline);
    return outline;
}

function getBinaryContrast(data) {
    let contrastSensitivity = document.getElementById("sensitivityInputContrast").value/10;
    let binaryContrast = [];
    for (let y = 0; y < data.length; y++) {
        let line = [];
        for (let x = 0; x < data[0].length; x++) {
            if (Math.abs(data[y][x]) >= contrastSensitivity) {
                line.push(1);
            } else {
                line.push(0);
            }
        }
        binaryContrast.push(line);
    }
    return binaryContrast;
}

function findFirst(line) {
    for (let y = 0; y < line.length; y++) {
        if (line[y] >= sensitivity) {
            return y;
        }
    }
    return -1;
}

function findLast(line) {
    for (let y = line.length - 1; y >= 0; y--) {
        if (line[y] >= sensitivity) {
            return y;
        }
    }
    return -1;
}

function rotateOutline(array) {
    let outline = [];
    for (let y = 0; y < array[0].length; y++) {
        let line = [];
        for (let x = 0; x < array.length; x++) {
            if (Math.abs(array[x][y]) == 1) {
                line.push(1);
            } else {
                line.push(0);
            }
        }
        outline.push(line);
    }
    return outline;
}

function reduceHorizontalDuplicates(array) {
    let newArray = [];
    for (let y = 0; y < array.length; y++) {
        let line = [];
        for (let z = 0; z < array[y].length; z++) {
            line.push(array[y][z]);
        }
        for (let x = 1; x < array[y].length - 1; x++) {
            if (array[y][x - 1] == 1 && array[y][x + 1] == 1) {
                line[x] = 0;
            }
        }
        newArray.push(line);
    }
    return newArray;
}


//########################################
//  Convert to coords
//########################################

function convertToCoords(data) {
    let coords = [];
    let outlineData = [];
    for (let z = 0; z < data.length; z++) {
        let slide = makeOutline(data[z]);
        outlineData.push(slide);
    }
    for (let z = 0; z < outlineData.length; z++) {
        coords.push([]);
        for (let y = 0; y < outlineData[z].length; y++) {
            for (let x = 0; x < outlineData[z][y].length; x++) {
                if (outlineData[z][y][x] === 1) {
                    let coord = [y, x];
                    coords[z].push(coord);
                }
            }
        }
    }
    return coords;
}

function pressSave() {
    coords = convertToCoords(outlineData);
    saveCoords(coords);
}

function saveCoords(data) {
    let jsonData = JSON.stringify(data);
    let name = document.getElementById("filename").value;
    console.log("Starting download");
    download(jsonData, name + '.json', 'application/json');
}

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    console.log("Download finished");
}