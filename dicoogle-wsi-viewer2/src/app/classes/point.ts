export class Point {
    _x: number;
    _y: number;

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    set x(x: number) {
        this._x = x;
    }

    get x(): number {
        return this._x;
    }

    set y(x: number) {
        this._y = x;
    }

    get y(): number {
        return this._y;
    }
}

export class ImagePoint extends Point {

    _insideImage: boolean

    constructor(x: number, y: number, isInsideImage: boolean) {
        super(x, y);
        this._insideImage = isInsideImage;
    }

    set isInsideImage(isInsideImage: boolean) {
        this._insideImage = isInsideImage;
    }

    get isInsideImage(): boolean {
        return this._insideImage;
    }

}