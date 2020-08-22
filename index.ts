const w : number = window.innerWidth 
const h : number = window.innerHeight
const circles : number = 5  
const scGap : number = 0.02 
const strokeFactor : number = 90 
const sizeFactor : number = 5.6 
const colors : Array<string> = ["#F44336", "#3F51B5", "#4CAF50", "#2196F3", "#FF5722"]
const backColor : string = "#bdbdbd"
const lineColor : string = "#795548"

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