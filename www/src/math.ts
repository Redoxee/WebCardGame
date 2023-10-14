import { Vec2 } from './vec';

interface IBezierParams {
	p1x: number,
	p1y: number,
	p2x: number,
	p2y: number,
}

class BezierPreset{
	static EaseInOut : IBezierParams = 
	{
		p1x : 0.32, 
		p1y : 0.0, 
		p2x : 0.5, 
		p2y : 1
	}

	static Linear : IBezierParams = 
	{
		p1x : .32,
		p1y : .32,
		p2x : .75,
		p2y : .75
	};

	static DefaultBezierParams = {
		p1x : 0.5,
		p1y : 0.5,
		p2x : 0.5,
		p2y : 0.5,
	};
}

function cubicInterpolationBezier(t : number, params : IBezierParams) : Vec2{
	const tSquare = t * t;
	const tCube = tSquare * t;
	const p1Factor = (3 * tCube - 6 * tSquare + 3 * t);
	const p2Factor = (-3 * tCube + 3 * tSquare);
	const posX = params.p1x * p1Factor + params.p2x * p2Factor + tCube;
	const posY = params.p1y * p1Factor + params.p2y * p2Factor + tCube;
	return new Vec2(posX , posY);
}

function cubicInterpolationBezierFirstDerivative(t : number, params : IBezierParams) : Vec2{
	const tSquare = t * t;
	const p1Factor = (9 * tSquare - 12 * t + 3);
	const p2Factor = (-9 * tSquare + 6 *t);
	const posX = params.p1x * p1Factor + params.p2x * p2Factor + 3 * tSquare;
	const posY = params.p1y * p1Factor + params.p2y * p2Factor + 3 * tSquare;
	return new Vec2(posX , posY);
}

function cubicInterpolationBezierSecondDerivative(t : number, params: IBezierParams) : Vec2{
	const p1Factor = (18 * t - 12);
	const p2Factor = (-19 * t + 6);
	const posX = params.p1x * p1Factor + params.p2x * p2Factor + 6 * t;
	const posY = params.p1y * p1Factor + params.p2y * p2Factor + 6 * t;
	return new Vec2(posX , posY);
}

export { IBezierParams, BezierPreset, cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative, cubicInterpolationBezierSecondDerivative };