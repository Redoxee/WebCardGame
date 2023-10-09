class Vec2 {
	x : number;
	y: number;

	static Zero = new Vec2(0, 0)

	constructor(x : number, y : number) {
		if ( x === null)
		{
			this.x = 0;
			this.y = 0;
		} else {
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
		return new Vec2(this.x / length, this.y /length);
	}

	scale(scale : number) {
		return new Vec2(this.x * scale, this.y * scale);
	}

	static dot(a: Vec2, b : Vec2) {
		return a.x * b.x + a.y * b.y;
	}

	static cross(a: Vec2, b : Vec2) {
		return new Vec3(
			0,
			0,
			a.x * b.y - a.y * b.x,
		);
	}

	static add(a: Vec2, b : Vec2) {
		return new Vec2(a.x + b.x, a.y + b.y);
	}

	static sub(a: Vec2, b : Vec2) {
		return new Vec2(a.x - b.x, a.y - b.y);
	}

	static equal(a: Vec2, b : Vec2) {
		return a.x === b.x && a.y === b.y;
	}
}

class Vec3 {
	x : number;
	y: number;
	z: number;

	static Zero = new Vec3(0, 0, 0);
	static Up = new Vec3(0, 1, 0);
	static Down = new Vec3(0, -1, 0);
	static Left = new Vec3(-1, 0, 0);
	static Right = new Vec3(1, 0, 0);
	static Forward = new Vec3(0, 0, -1);
	static Backward = new Vec3(0, 0, 1);

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

	scale(scale : number) {
		return new Vec3(this.x * scale, this.y * scale, this.z * scale);
	}

	static dot(a : Vec3, b : Vec3) {
		return a.x * b.x + a.y * b.y + a.z * b.z;
	}

	static cross(a : Vec3, b : Vec3) {
		return new Vec3(
			a.y * b.z - a.z * b.y,
			a.z * b.x - a.x * b.z,
			a.x * b.y - a.y * b.x,
		);
	}

	static add(a : Vec3, b : Vec3) {
		return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
	}

	static sub(a: Vec3, b: Vec3) {
		return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
	}

	static equal(a: Vec3, b : Vec3) {
		return a.x === b.x && a.y === b.y && a.z === b.z;
	}
}

export {Vec2, Vec3}