class Vec3 {
	x : number;
	y: number;
	z: number;

	constructor(x : number, y : number,z :number) {
		if ( x === null)
		{
			this.x = 0;
			this.y = 0;
			this.z = 0;
		} else {
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
		return new Vec3(this.x / length, this.y /length, this.z / length);
	}

	dot(other : Vec3) {
		return this.x * other.x + this.y * other.y + this.z * other.z;
	}

	cross(other : Vec3) {
		return new Vec3(
			this.y * other.z - this.z * other.y,
			this.z * other.x - this.x * other.z,
			this.x * other.y - this.y * other.x,
		);
	}

	add(other : Vec3) {
		return new Vec3(this.x + other.x, this.y * other.y, this.z * other.z);
	}

	scale(scale : number) {
		return new Vec3(this.x * scale, this.y * scale, this.z * scale);
	}
}

export = Vec3;