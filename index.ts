import { fcall } from "q"

const w : number = window.innerWidth 
const h : number = window.innerHeight
const circles : number = 5  
const scGap : number = 0.02 
const strokeFactor : number = 90 
const sizeFactor : number = 5.6 
const colors : Array<string> = ["#F44336", "#3F51B5", "#4CAF50", "#2196F3", "#FF5722"]
const backColor : string = "#bdbdbd"
const lineColor : string = "#795548"
const delay : number = 20

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n 
    }

    static sinify(scale : number) : number {
        return Math.sin(scale * Math.PI)
    }
}

class DrawingUtil {
    
    static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
    }

    static drawCircle(context : CanvasRenderingContext2D, x : number, y : number, r : number) {
        context.beginPath()
        context.arc(x, y, r, 0, 2 * Math.PI)
        context.fill()
    }

    static drawLineNode(context : CanvasRenderingContext2D, scale : number) {
        const sc1 : number = ScaleUtil.divideScale(scale, 0, 2)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, 2)
        for (var j = 0; j < 2; j++) {
            const sci : number = ScaleUtil.divideScale(scale, j, 2)
            const sk : number = 2 * j - 1
            const start : number = w * 0.5 * (1 - j)
            const dx : number = w * 0.5 * sk * sci 
            const ystart : number = h / 2
            const dy : number = h * 0.5 * sci  
            DrawingUtil.drawLine(context, start, ystart, start + dx, ystart - dy)    
        }
    }

    static drawCircleNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        const sc1 : number = ScaleUtil.divideScale(scale, 0, 2)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, 2)
        const sf : number = ScaleUtil.sinify(sc2)
        const r : number = Math.min(w, h) / sizeFactor 
        DrawingUtil.drawCircle(context, w * 0.5 - w * 0.5 * sf, h * (1 - sc2), r * sc1)
    }
}

class Stage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D 

    initCanvas() {
        this.canvas.width = w 
        this.canvas.height = h 
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor 
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : Stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    
    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += scGap * this.dir 
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir 
            this.dir = 0
            this.prevScale = this.scale 
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale 
            cb()
        }
    }
}

class Animator {

    animated : boolean = false 
    interval : number 
    
    start(cb : Function) {
        if (!this.animated) {
            this.animated = true 
            this.interval = setInterval(cb, delay)
        }
    }
    
    stop(cb : Function) {
        if (this.animated) {
            this.animated = false 
            clearInterval(this.interval)
        }
    }
}

class Node {

    protected state : State = new State()
    protected next : Node = null 
    protected prev : Node = null 

    update(cb : Function) {
        this.state.update(cb)
    }

    draw(context : CanvasRenderingContext2D) {

    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : Node {
        var curr : Node = this.prev 
        if (dir == 1) {
            curr = this.next 
        }
        if (!!curr) {
            return curr 
        }
        cb()
        return this 
    }
}

class LineNode extends Node {

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawLineNode(context, this.state.scale);
    }
}