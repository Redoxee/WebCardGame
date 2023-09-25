"use strict";
class vec3 {
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
        return new vec3(this.x / length, this.y / length, this.z / length);
    }
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    cross(other) {
        return new vec3(this.y * other.z - this.z * other.y, this.z * other.x - this.x * other.z, this.x * other.y - this.y * other.x);
    }
    add(other) {
        return new vec3(this.x + other.x, this.y * other.y, this.z * other.z);
    }
    scale(scale) {
        return new vec3(this.x * scale, this.y * scale, this.z * scale);
    }
}
