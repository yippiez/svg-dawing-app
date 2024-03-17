
const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

var svgContext = {
    svgElementID: 'svg',
    parameters: {
        defaultColor: '#000000',
        defaultStrokeWidth: 1,
        pencilStrokeConstant: 2,
        circleStrokeConstant: 10,
        rectangleStrokeConstant: 10,
    },

    bin: [],

    getSVGElement() {
        return document.getElementById(this.svgElementID);
    },

    getDefaultColor() {
        return this.parameters.defaultColor;
    },

    getDefaultStrokeWidth() {
        return this.parameters.defaultStrokeWidth;
    },

    calculatePencilStrokeConstant(value) {
        return value * this.parameters.pencilStrokeConstant;
    },

    calculateCircleStrokeConstant(value) {
        return value * this.parameters.circleStrokeConstant;
    },

    calculateRectangleStrokeConstant(value) {
        return value * this.parameters.rectangleStrokeConstant;
    },

    getSVGCoordinates(event) {
        var svg = this.getSVGElement();
        var rect = svg.getBoundingClientRect();

        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        return { x, y };
    },

    toSVG() {
        var result = '';
        var stack = [];

        for (var i = 0; i < this.bin.length; i++) {

            var current = this.bin[i];
            var next = this.bin[i + 1];

            switch (current.type) {
                case 'pencil':
                    stack.push(current);

                    if (next === undefined || next.type !== 'pencil') {
                        result += `<path d="M ${stack[0].x} ${stack[0].y}`;

                        for (var j = 1; j < stack.length; j++) {
                            result += ` L ${stack[j].x} ${stack[j].y}`;
                        }

                        result += `" stroke="${stack[0].color}" stroke-width="${stack[0].width}" fill="none" />`;

                        stack = [];
                    }
                    break;

                case 'circle':
                    result += `<circle cx="${current.x}" cy="${current.y}" r="${current.width}" stroke="${current.color}" stroke-width="${current.width}" fill="${current.color}" />`;
                    break;

                case 'rectangle':
                    result += `<rect x="${current.x}" y="${current.y}" width="${current.width}" height="${current.width}" stroke="${current.color}" stroke-width="${current.width}" fill="none" />`;
                    break;

                case 'end':
                    break;
            }
        }

        return result;
    },


    update() {
        var svg = svgContext.getSVGElement();
        var textBox = document.getElementById('svgDumpTextbox');

        let newHTML = svgContext.toSVG();
        svg.innerHTML = newHTML;
        textBox.value = "<svg>\n" + newHTML + "</svg>";
    },

    undo() {
        if (this.bin.length === 0)
            return;

        if (this.bin[this.bin.length - 1].type === 'end')
            this.bin.pop();

        let last = this.bin.pop();

        // Treat special if the last element is a pencil
        while (last.type === 'pencil') {
            last = this.bin.pop();

            if (last === undefined)
                break;
        }

        this.bin.push({ type: 'end' });
        this.update();
    },

    clear() {
        this.bin = [];
        this.update();
    },

};

function updateColorPicker(newColor) {
    document.getElementById('color-picker').value = newColor;
}

function updateStrokeWidth(newStrokeWidth) {
    document.getElementById('stroke-width').value = newStrokeWidth;
}

document.addEventListener('alpine:init', () => {
    Alpine.store('svgPressed', {
        pressed: false,
        leftWhilePressed: false,
        currentColor: svgContext.getDefaultColor(),
        currentStrokeWidth: 1,

        mouseUp(event) {
            this.pressed = false;
            this.leftWhilePressed = false;

            svgContext.bin.push({ type: 'end' });
            // console.log("UP", "Pressed", this.pressed, "LeftWhilePressed", this.leftWhilePressed);
        },

        mouseDown(event, selectedTool) {
            this.pressed = true;
            this.leftWhilePressed = false;

            let { x, y } = svgContext.getSVGCoordinates(event);
            let pencilWidth = svgContext.calculatePencilStrokeConstant(this.currentStrokeWidth);
            let circleWidth = svgContext.calculateCircleStrokeConstant(this.currentStrokeWidth);
            let rectangleWidth = svgContext.calculateRectangleStrokeConstant(this.currentStrokeWidth);

            switch (selectedTool) {
                case 'pencil':
                    svgContext.bin.push({ type: selectedTool, x: x, y: y, width: pencilWidth, color: this.currentColor });
                    break;
                case 'circle':
                    svgContext.bin.push({ type: selectedTool, x: x, y: y, width: circleWidth, color: this.currentColor });
                    break;
                case 'rectangle':
                    svgContext.bin.push({ type: selectedTool, x: x, y: y, width: rectangleWidth, color: this.currentColor });
                    break;

            }

            // console.log("DOWN", "Pressed", this.pressed, "LeftWhilePressed", this.leftWhilePressed);

            svgContext.update();
        },

        mouseEnter(event) {
            this.pressed = this.pressed || (this.leftWhilePressed && event.buttons === 1);
            this.leftWhilePressed = false;

            // console.log("ENTER", "Pressed", this.pressed, "LeftWhilePressed", this.leftWhilePressed);
        },

        mouseLeave(event) {
            this.leftWhilePressed = this.pressed;
            this.pressed = false;

            // console.log("LEFT", "Pressed", this.pressed, "LeftWhilePressed", this.leftWhilePressed);
        },

        mouseMove(event, selectedTool) {
            if (this.pressed) {
                let { x, y } = svgContext.getSVGCoordinates(event);
                let pencilWidth = svgContext.calculateCircleStrokeConstant(this.currentStrokeWidth);

                if (selectedTool === 'pencil') {
                    svgContext.bin.push({ type: selectedTool, x: x, y: y, width: pencilWidth, color: this.currentColor });
                    svgContext.update();
                }
            }

            // console.log("MOVED", "Pressed", this.pressed, "LeftWhilePressed", this.leftWhilePressed);
        },

        undo() {
            svgContext.undo();
        },

        clear() {
            svgContext.clear();
        },

    })
})

document.addEventListener('DOMContentLoaded', () => {
    svgContext.update();

    updateColorPicker(svgContext.getDefaultColor());
    updateStrokeWidth(svgContext.getDefaultStrokeWidth());
})
