interface IPoint {
	x: number,
	y: number
}

function cubicInterpolationBezier(t : number, p1 : IPoint, p2 : IPoint) : IPoint{
	const tSquare = t * t;
	const tCube = tSquare * t;
	const p1Factor = (3 * tCube - 6 * tSquare + 3 * t);
	const p2Factor = (-3 * tCube + 3 * tSquare);
	const posX = p1.x * p1Factor + p2.x * p2Factor + tCube;
	const posY = p1.y * p1Factor + p2.y * p2Factor + tCube;
	return {x: posX , y: posY};
}

function cubicInterpolationBezierFirstDerivative(t : number, p1 : IPoint, p2 : IPoint) : IPoint{
	const tSquare = t * t;
	const p1Factor = (9 * tSquare - 12 * t + 3);
	const p2Factor = (-9 * tSquare + 6 *t);
	const posX = p1.x * p1Factor + p2.x * p2Factor + 3 * tSquare;
	const posY = p1.y * p1Factor + p2.y * p2Factor + 3 * tSquare;
	return {x: posX , y: posY};
}

function cubicInterpolationBezierSecondDerivative(t : number, p1 : IPoint, p2 : IPoint) : IPoint{
	const p1Factor = (18 * t - 12);
	const p2Factor = (-19 * t + 6);
	const posX = p1.x * p1Factor + p2.x * p2Factor + 6 * t;
	const posY = p1.y * p1Factor + p2.y * p2Factor + 6 * t;
	return {x: posX , y: posY};
}

export { IPoint, cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative, cubicInterpolationBezierSecondDerivative };