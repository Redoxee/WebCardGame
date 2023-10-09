import { Vec2 } from './vec';
function cubicInterpolationBezier(t, params) {
    const tSquare = t * t;
    const tCube = tSquare * t;
    const p1Factor = (3 * tCube - 6 * tSquare + 3 * t);
    const p2Factor = (-3 * tCube + 3 * tSquare);
    const posX = params.p1x * p1Factor + params.p2x * p2Factor + tCube;
    const posY = params.p1y * p1Factor + params.p2y * p2Factor + tCube;
    return new Vec2(posX, posY);
}
function cubicInterpolationBezierFirstDerivative(t, params) {
    const tSquare = t * t;
    const p1Factor = (9 * tSquare - 12 * t + 3);
    const p2Factor = (-9 * tSquare + 6 * t);
    const posX = params.p1x * p1Factor + params.p2x * p2Factor + 3 * tSquare;
    const posY = params.p1y * p1Factor + params.p2y * p2Factor + 3 * tSquare;
    return new Vec2(posX, posY);
}
function cubicInterpolationBezierSecondDerivative(t, params) {
    const p1Factor = (18 * t - 12);
    const p2Factor = (-19 * t + 6);
    const posX = params.p1x * p1Factor + params.p2x * p2Factor + 6 * t;
    const posY = params.p1y * p1Factor + params.p2y * p2Factor + 6 * t;
    return new Vec2(posX, posY);
}
export { cubicInterpolationBezier, cubicInterpolationBezierFirstDerivative, cubicInterpolationBezierSecondDerivative };
