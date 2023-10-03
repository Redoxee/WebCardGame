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

	dot(other : Vec2) {
		return this.x * other.x + this.y * other.y;
	}

	cross(other : Vec2) {
		return new Vec3(
			0,
			0,
			this.x * other.y - this.y * other.x,
		);
	}

	add(other : Vec2) {
		return new Vec2(this.x + other.x, this.y + other.y);
	}

	scale(scale : number) {
		return new Vec2(this.x * scale, this.y * scale);
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
		return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
	}

	scale(scale : number) {
		return new Vec3(this.x * scale, this.y * scale, this.z * scale);
	}
}
