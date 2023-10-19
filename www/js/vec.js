class Vec2 {
    constructor(x, y) {
        if (x === null) {
            this.x = 0;
            this.y = 0;
        }
        else {
            this.x = x;
            this.y = y;
        }
    }
    clone() {
        return new Vec2(this.x, this.y);
    }
    toString() {
        return `(${this.x}, ${this.y})`;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        const length = this.length();
        this.x = this.x / length;
        this.y = this.y / length;
        return this;
    }
    norm() {
        const length = this.length();
        return new Vec2(this.x / length, this.y / length);
    }
    scale(scale) {
        return new Vec2(this.x * scale, this.y * scale);
    }
    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    static cross(a, b) {
        return new Vec3(0, 0, a.x * b.y - a.y * b.x);
    }
    static add(a, b) {
        return new Vec2(a.x + b.x, a.y + b.y);
    }
    static sub(a, b) {
        return new Vec2(a.x - b.x, a.y - b.y);
    }
    static equal(a, b) {
        return a.x === b.x && a.y === b.y;
    }
}
Vec2.Zero = new Vec2(0, 0);
Vec2.Up = new Vec2(0, 1);
Vec2.Right = new Vec2(1, 0);
class Vec3 {
    constructor(x, y, z) {
        if (x === null) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
        else {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }
    toString() {
        return `(${this.x}, ${this.y}, ${this.z})`;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    normalize() {
        const length = this.length();
        this.x = this.x / length;
        this.y = this.y / length;
        this.z = this.z / length;
        return this;
    }
    norm() {
        const length = this.length();
        return new Vec3(this.x / length, this.y / length, this.z / length);
    }
    scale(scale) {
        return new Vec3(this.x * scale, this.y * scale, this.z * scale);
    }
    static dot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    static cross(a, b) {
        return new Vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    }
    static add(a, b) {
        return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
    }
    static sub(a, b) {
        return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
    }
    static equal(a, b) {
        return a.x === b.x && a.y === b.y && a.z === b.z;
    }
}
Vec3.Zero = new Vec3(0, 0, 0);
Vec3.Up = new Vec3(0, 1, 0);
Vec3.Down = new Vec3(0, -1, 0);
Vec3.Left = new Vec3(-1, 0, 0);
Vec3.Right = new Vec3(1, 0, 0);
Vec3.Forward = new Vec3(0, 0, -1);
Vec3.Backward = new Vec3(0, 0, 1);
export { Vec2, Vec3 };
