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
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
    cross(other) {
        return new Vec3(0, 0, this.x * other.y - this.y * other.x);
    }
    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }
    scale(scale) {
        return new Vec2(this.x * scale, this.y * scale);
    }
}
Vec2.Zero = new Vec2(0, 0);
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
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    cross(other) {
        return new Vec3(this.y * other.z - this.z * other.y, this.z * other.x - this.x * other.z, this.x * other.y - this.y * other.x);
    }
    add(other) {
        return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    scale(scale) {
        return new Vec3(this.x * scale, this.y * scale, this.z * scale);
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
