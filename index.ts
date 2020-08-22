const w : number = window.innerWidth 
const h : number = window.innerHeight 
const parts : number = 3
const scGap : number = 0.02 / parts  
const strokeFactor : number = 90 
const sizeFactor : number = 9.9 
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
        const sc1 : number = ScaleUtil.divideScale(scale, 0, parts)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, parts)
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor 
        context.strokeStyle = lineColor 
        for (var j = 0; j < 2; j++) {
            const sci : number = ScaleUtil.divideScale(scale, j, 2)
            const sk : number = 2 * j - 1
            const start : number = w * 0.5 * (1 - j)
            const dx : number = w * 0.5 * sk * sci 
            const ystart : number = h * 0.5 + h * 0.5 * (1 - j)
            const dy : number = h * 0.5 * sci  
            DrawingUtil.drawLine(context, start, ystart, start + dx, ystart - dy)    
        }
    }

    static drawCircleNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        const sc1 : number = ScaleUtil.divideScale(scale, 0, parts)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, parts)
        const sc3 : number = ScaleUtil.divideScale(scale, 2, parts)
        context.fillStyle = colors[i]
        const sf : number = ScaleUtil.sinify(sc2)
        const r : number = Math.min(w, h) / sizeFactor 
        DrawingUtil.drawCircle(context, w * 0.5 - w * 0.5 * sf, h * (1 - sc2), r * (sc1 - sc3))
    }
}

class Stage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D 
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w 
        this.canvas.height = h 
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor 
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
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
        console.log(this.scale)
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

class CanvasNode {

    protected state : State = new State()
    protected next : CanvasNode = null 
    protected prev : CanvasNode = null 

    update(cb : Function) {
        this.state.update(cb)
    }

    draw(context : CanvasRenderingContext2D) {

    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    setPrev(node : CanvasNode) {
        this.prev = node;
    }

    setNext(next : CanvasNode) {
        this.next = next;
    }

    getNext(dir : number, cb : Function) : CanvasNode {
        var curr : CanvasNode = this.prev 
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

class LineNode extends CanvasNode {

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawLineNode(context, this.state.scale);
    }
}

class CircleNode extends CanvasNode {

    constructor(private i : number) {
        super()
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < colors.length - 1) {
            this.next = new CircleNode(this.i + 1)
            this.next.setPrev(this) 
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawCircleNode(context, this.i, this.state.scale)
    }
}

class LineCircleContainer {

     
    dir : number = 1
    root : CanvasNode = new LineNode()
    curr : CanvasNode = this.root
    constructor() {
        this.root.setNext(new CircleNode(0))
    }

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
        if (this.curr != this.root) {
            this.curr.draw(context)
        }
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    lcc : LineCircleContainer = new LineCircleContainer()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.lcc.draw(context)
    }

    handleTap(cb : Function) {
        this.lcc.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.lcc.update(() => {
                    this.animator.stop(cb)
                })
            })
        })
    }
}